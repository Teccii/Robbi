import { Events, Sticker, StickerType } from "discord.js";
import { SettingsModel } from "models/Settings";
import { EmbedColor } from "lib/config";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";

const stickerDelete: Event = {
    name: Events.GuildStickerDelete,
    once: false,
    exec: async (client, sticker: Sticker) => {
        if (!sticker.guild || sticker.type == StickerType.Standard) {
            return;
        }

        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(sticker.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: sticker.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${sticker.guild.id})`);

            client.settings.set(sticker.guild.id, s);
            sticker.settings = s;
        } else {
            const s = client.settings.get(sticker.guild.id)!;

            sticker.settings = s;
        }

        const logChannelIds = sticker.settings.events.filter(v => v.event == "expressionDelete").map(v => v.channel);

        for (const id of logChannelIds) {
            const logChannel = await sticker.guild.channels.fetch(id);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased() && logChannel.id != sticker.id) {
                await logChannel.send({
                    embeds: [client.simpleEmbed({
                        title: `Sticker :${sticker.name}: deleted`,
                        footer: `Sticker ID: ${sticker.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Error
                    }).setImage(sticker.url)]
                });
            }
        }
    }
};

export default stickerDelete;