import { Events, Role } from "discord.js";
import { SettingsModel } from "models/Settings";
import { EmbedColor } from "lib/config";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";

const roleDelete: Event = {
    name: Events.GuildRoleDelete,
    once: false,
    exec: async (client, role: Role) => {
        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(role.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: role.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${role.guild.id})`);

            client.settings.set(role.guild.id, s);
            role.settings = s;
        } else {
            const s = client.settings.get(role.guild.id)!;

            role.settings = s;
        }

        const logChannelIds = role.settings.events.filter(v => v.event == "roleDelete").map(v => v.channel);

        for (const id of logChannelIds) {
            const logChannel = await role.guild.channels.fetch(id);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
                await logChannel.send({
                    embeds: [client.simpleEmbed({
                        title: `Role "${role.name}" deleted`,
                        footer: `Role ID: ${role.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Error
                    })]
                });
            }
        }
    }
};

export default roleDelete;