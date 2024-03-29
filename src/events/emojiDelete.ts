import { Events, GuildEmoji } from "discord.js";
import { SettingsModel } from "models/Settings";
import { EmbedColor } from "lib/config";
import { getEmojiUrl } from "lib/emoji";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";

const emojiDelete: Event = {
    name: Events.GuildEmojiDelete,
    once: false,
    exec: async (client, emoji: GuildEmoji) => {
        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(emoji.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: emoji.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${emoji.guild.id})`);

            client.settings.set(emoji.guild.id, s);
            emoji.settings = s;
        } else {
            const s = client.settings.get(emoji.guild.id)!;

            emoji.settings = s;
        }

        const logChannelIds = emoji.settings.events.filter(v => v.event == "expressionDelete").map(v => v.channel);

        for (const id of logChannelIds) {
            const logChannel = await emoji.guild.channels.fetch(id);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased() && logChannel.id != emoji.id) {
                await logChannel.send({
                    embeds: [client.simpleEmbed({
                        title: `Emoji :${emoji.name}: deleted`,
                        footer: `Emoji ID: ${emoji.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Error
                    }).setImage(getEmojiUrl(emoji.identifier))]
                });
            }
        }
    }
};

export default emojiDelete;