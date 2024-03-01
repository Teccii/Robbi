import { Events, Message } from "discord.js";
import { SettingsModel } from "models/Settings";
import { LevelModel } from "models/Level";
import { handleNewLevel, xpToLevel } from "lib/xp";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";

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

        if (!client.cooldownHandler.has(`${message.author.id}-msgXP`)) {
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

            client.cooldownHandler.set(`${message.author.id}-msgXP`, message.settings.leveling.messageCooldown * 1000);
        }

        if (message.reference) {
            const repliedMessage = await message.fetchReference();

            if (!repliedMessage.author.bot && repliedMessage.guild && repliedMessage.author.id != message.author.id && !client.cooldownHandler.has(`${repliedMessage.author.id}-replyXP`)) {
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

                client.cooldownHandler.set(`${repliedMessage.author.id}-replyXP`, message.settings.leveling.replyCooldown * 1000);
            }
        }
    }
};

export default messageCreate;