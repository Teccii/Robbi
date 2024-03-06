import { Events, Message } from "discord.js";
import { SettingsModel } from "models/Settings";
import { LevelModel } from "models/Level";
import { handleNewLevel, xpToLevel } from "lib/xp";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import { AFKModel } from "models/AFK";
import { EmbedColor } from "lib/config";

const messageCreate: Event = {
    name: Events.MessageCreate,
    once: false,
    exec: async (client, message: Message) => {
        if (message.author.bot || !message.guild) {
            return;
        }

        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(message.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: message.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${message.guild.id})`);

            client.settings.set(message.guild.id, s);
            message.settings = s;
        } else {
            const s = client.settings.get(message.guild.id)!;

            message.settings = s;
        }
        
        if (await client.getCooldown(`${message.author.id}-msgXP`) === null) {
            const messageMin = message.settings.leveling.messageMin;
            const messageMax = message.settings.leveling.messageMax;
            const msgXp = Math.floor(messageMin + Math.random() * (messageMax - messageMin));

            const leveling = await LevelModel.findOneAndUpdate(
                { guildId: message.guild.id, userId: message.author.id },
                { $inc: { xp: msgXp } },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            const calcLevel = xpToLevel(leveling.xp);

            if (message.member && calcLevel != leveling.cachedLevel) {
                await handleNewLevel(
                    client,
                    message.member,
                    message.channel,
                    calcLevel,
                    leveling,
                    message.settings
                );
            }

            await client.addCooldown(`${message.author.id}-msgXP`, message.settings.leveling.messageCooldown);
        }

        await AFKModel.deleteOne({
            guildId: message.guild.id,
            userId: message.author.id,
        });

        for (const [_, user] of message.mentions.users) {
            const afk = await AFKModel.findOne({
                guildId: message.guild.id,
                userId: user.id
            });

            if (afk) {
                await message.reply({
                    embeds: [client.simpleEmbed({
                        description: `${user} is AFK: \`${afk.reason}\``,
                        color: EmbedColor.Neutral,
                    })]
                });
            }
        }
        
        if (message.reference) {
            const repliedMessage = await message.fetchReference();

            if (
                !repliedMessage.author.bot
                && repliedMessage.guild
                && repliedMessage.author.id != message.author.id
                && await client.getCooldown(`${repliedMessage.author.id}-replyXP`) === null
            ) {
                const replyMin = message.settings.leveling.replyMin;
                const replyMax = message.settings.leveling.replyMax;
                const replyXp = Math.floor(replyMin + Math.random() * (replyMax - replyMin));

                const leveling = await LevelModel.findOneAndUpdate(
                    { guildId: repliedMessage.guild.id, userId: repliedMessage.author.id },
                    { $inc: { xp: replyXp } },
                    { upsert: true, setDefaultsOnInsert: true, new: true }
                );

                const calcLevel = xpToLevel(leveling.xp);

                if (repliedMessage.member && calcLevel != leveling.cachedLevel) {
                    await handleNewLevel(
                        client,
                        repliedMessage.member,
                        repliedMessage.channel,
                        calcLevel,
                        leveling,
                        message.settings
                    );
                }

                await client.addCooldown(`${repliedMessage.author.id}-replyXP`, message.settings.leveling.replyCooldown);
            }
        }
    }
};

export default messageCreate;