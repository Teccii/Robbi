import { Events, Sticker, StickerType } from "discord.js";
import { SettingsModel } from "models/Settings";
import { EmbedColor } from "lib/config";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";

const stickerUpdate: Event = {
    name: Events.GuildStickerUpdate,
    once: false,
    exec: async (client, oldSticker: Sticker, newSticker: Sticker) => {
        if (!newSticker.guild || newSticker.type == StickerType.Standard) {
            return;
        }

        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(newSticker.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: newSticker.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${newSticker.guild.id})`);

            client.settings.set(newSticker.guild.id, s);
            newSticker.settings = s;
        } else {
            const s = client.settings.get(newSticker.guild.id)!;

            newSticker.settings = s;
        }

        const logChannelIds = newSticker.settings.events.filter(v => v.event == "expressionUpdate").map(v => v.channel);

        for (const id of logChannelIds) {
            const logChannel = await newSticker.guild.channels.fetch(id);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased() && logChannel.id != newSticker.id) {
                await logChannel.send({
                    embeds: [client.simpleEmbed({
                        title: `Sticker :${oldSticker.name}: updated`,
                        footer: `Sticker ID: ${newSticker.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Neutral
                    }).setFields(
                        { name: "Before", value: `**Name**: ${oldSticker.name}`, inline: true },
                        { name: "After", value: `**Name**: ${newSticker.name}`, inline: true },
                    ).setThumbnail(newSticker.url)]
                });
            }
        }
    }
};

export default stickerUpdate;