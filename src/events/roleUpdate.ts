import { SettingsModel } from "models/Settings";
import { Events, Role } from "discord.js";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";
import { EmbedColor } from "lib/config";

const roleUpdate: Event = {
    name: Events.GuildRoleUpdate,
    once: false,
    exec: async (client, oldRole: Role, newRole: Role) => {
        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(newRole.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: newRole.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${newRole.guild.id})`);

            client.settings.set(newRole.guild.id, s);

            oldRole.settings = s;
            newRole.settings = s;
        } else {
            const s = client.settings.get(newRole.guild.id)!;

            oldRole.settings = s;
            newRole.settings = s;
        }

        const logChannelIds = newRole.settings.events.filter(v => v.event == "roleCreate").map(v => v.channel);

        for (const id of logChannelIds) {
            const logChannel = await newRole.guild.channels.fetch(id);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
                let differences: {
                    field: string,
                    before: string,
                    after: string
                }[] = [];

                if (newRole.name != oldRole.name) {
                    differences.push({
                        field: "Name",
                        before: oldRole.name,
                        after: newRole.name,
                    });
                }

                if (newRole.hexColor != oldRole.hexColor) {
                    differences.push({
                        field: "Color",
                        before: oldRole.hexColor,
                        after: newRole.hexColor,
                    });
                }

                if (newRole.position != oldRole.position) {
                    differences.push({
                        field: "Position",
                        before: oldRole.position.toString(),
                        after: newRole.position.toString(),
                    });
                }

                if (newRole.hoist != oldRole.hoist) {
                    differences.push({
                        field: "Hoist",
                        before: oldRole.hoist.toString(),
                        after: newRole.hoist.toString(),
                    });
                }

                const newPerms = newRole.permissions;
                const oldPerms = oldRole.permissions;

                const enabled = newPerms.toArray().filter(v => !oldPerms.has(v));
                const disabled = oldPerms.toArray().filter(v => !newPerms.has(v));

                let embed = client.simpleEmbed({
                    title: `Role "${oldRole.name}" updated`,
                    footer: `Role ID: ${newRole.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                    color: EmbedColor.Neutral,
                });

                if (differences.length != 0) {
                    embed = embed.addFields(
                        { name: "Before", value: differences.map(v => `**${v.field}**: ${v.before}`).join("\n"), inline: true },
                        { name: "After", value: differences.map(v => `**${v.field}**: ${v.after}`).join("\n"), inline: true },
                    );
                }

                if (enabled.length != 0 || disabled.length != 0) {
                    let permsText = "";

                    for (const perm of enabled) {
                        permsText += `<:allow:1208121658506874910> ${perm}\n`;
                    }

                    for (const perm of disabled) {
                        permsText += `<:deny:1208121656640282634> ${perm}\n`;
                    }

                    embed = embed.addFields({ name: "Permissions", value: permsText });
                }

                await logChannel.send({ embeds: [embed] });
            }
        }
    }
};

export default roleUpdate;