import { Events, GuildEmoji } from "discord.js";
import { SettingsModel } from "models/Settings";
import { EmbedColor } from "lib/config";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";
import { getEmojiUrl } from "lib/emoji";

const emojiUpdate: Event = {
    name: Events.GuildEmojiUpdate,
    once: false,
    exec: async (client, oldEmoji: GuildEmoji, newEmoji: GuildEmoji) => {
        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(newEmoji.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: newEmoji.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${newEmoji.guild.id})`);

            client.settings.set(newEmoji.guild.id, s);

            oldEmoji.settings = s;
            newEmoji.settings = s;
        } else {
            const s = client.settings.get(newEmoji.guild.id)!;

            oldEmoji.settings = s;
            newEmoji.settings = s;
        }

        const logChannelIds = newEmoji.settings.events.filter(v => v.event == "expressionUpdate").map(v => v.channel);

        for (const id of logChannelIds) {
            const logChannel = await newEmoji.guild.channels.fetch(id);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased() && logChannel.id != newEmoji.id) {
                await logChannel.send({
                    embeds: [client.simpleEmbed({
                        title: `Emoji :${oldEmoji.name}: updated`,
                        footer: `Emoji ID: ${newEmoji.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Neutral
                    }).setFields(
                        { name: "Before", value: `**Name**: ${oldEmoji.name}`, inline: true },
                        { name: "After", value: `**Name**: ${newEmoji.name}`, inline: true },
                    ).setThumbnail(getEmojiUrl(newEmoji.identifier))]
                });
            }
        }
    }
};

export default emojiUpdate;