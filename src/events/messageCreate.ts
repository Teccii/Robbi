import { Events, Message } from "discord.js";
import { SettingsModel } from "models/Settings";
import { LevelModel } from "models/Level";
import { handleNewLevel, xpToLevel } from "lib/xp";
import { info, error, log} from "lib/log";
import { AFKModel } from "models/AFK";
import { EmbedColor } from "lib/config";
import Event from "lib/event";
import colors from "colors";

function filterMessage(text: string): string {
    text = text.replaceAll(/<@.+?>/g, "**Fuck you for trying**");
    text = text.replaceAll("@everyone", "**Fuck you for trying**");
    text = text.replaceAll("@here", "**Fuck you for trying**");
    text = text.trim();

    return text;
}

function getChunks(str: string, chunkSize: number, maxChunks: number): string[] {
    if (str.length < chunkSize) {
        return [str];
    }

    const originalLength = str.length;
    const chunks: string[] = [];

    while (str.length > chunkSize && chunks.length < maxChunks) {
        let nextStart = chunkSize;

        while (str[nextStart] !== ' ') {
            nextStart -= 1;
        }

        chunks.push(str.slice(0, nextStart));

        str = str.slice(nextStart);
    }

    if (chunks.length < maxChunks) {
        chunks.push(str);
    } else {
        chunks.push(`sorry i was yapping too much...\nstring length: ${originalLength} chars`);
    }

    return chunks;
}

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

        const aiChannels = message.settings.ai.channels;
        
        if (message.mentions.has(client.user!.id) && (aiChannels.length == 0 || aiChannels.includes(message.channel.id))) {
            const chat = client.chats.get(message.guild.id);

            if (!chat) {
                return;
            }

            try {
                info("ai user", `${message.author.username} (${message.author.id}) in ${message.guild.id}: ${message.cleanContent}`);

                message.channel.sendTyping();

                const response = (await chat.sendMessage(`${message.author.username}:\n${message.cleanContent}`)).response;
                const candidate = response.candidates![0];

                let text = "";

                for (const part of candidate.content.parts) {
                    text += part.text;
                }

                text = filterMessage(text);

                info("ai model", text);

                if (text.length <= 2000) {
                    setTimeout(() => message.reply(text), 2000);
                } else {
                    const chunks = getChunks(text, 2000, 4);

                    setTimeout(async () => {
                        let previousMsg = message;

                        for (const chunk of chunks) {
                            if (chunk == "") {
                                continue;
                            }

                            previousMsg = await previousMsg.reply(chunk);
                        }
                    }, 2000);
                }
            } catch (e) {
                error(`${e}`);

                message.reply(`sorry i dont know how to respond to this...\n${e}`);
            }
        }
    }
};

export default messageCreate;