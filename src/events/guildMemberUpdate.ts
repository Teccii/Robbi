import { SettingsModel } from "models/Settings";
import { Events, GuildMember } from "discord.js";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";
import { EmbedColor } from "lib/config";

const guildMemberUpdate: Event = {
    name: Events.GuildMemberUpdate,
    once: false,
    exec: async (client, oldMember: GuildMember, newMember: GuildMember) => {
        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(newMember.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: newMember.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${newMember.guild.id})`);

            client.settings.set(newMember.guild.id, s);

            oldMember.settings = s;
            newMember.settings = s;
        } else {
            const s = client.settings.get(newMember.guild.id)!;

            oldMember.settings = s;
            newMember.settings = s;
        }

        const logChannelIds = newMember.settings.events.filter(v => v.event == "guildMemberUpdate").map(v => v.channel);

        for (const id of logChannelIds) {
            const logChannel = await newMember.guild.channels.fetch(id);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
                let differences: {
                    field: string,
                    before: string,
                    after: string
                }[] = [];

                if (newMember.user.avatarURL() != oldMember.user.avatarURL()) {
                    differences.push({
                        field: "Avatar",
                        before: `${oldMember.user.avatarURL() ? `[link](${oldMember.user.avatarURL()})` : "None"}`,
                        after: `${newMember.user.avatarURL() ? `[link](${newMember.user.avatarURL()})` : "None"}`,
                    });
                }

                if (newMember.avatarURL() != oldMember.avatarURL()) {
                    differences.push({
                        field: "Server Avatar",
                        before: `${oldMember.avatarURL() ? `[link](${oldMember.avatarURL()})` : "None"}`,
                        after: `${newMember.avatarURL() ? `[link](${newMember.avatarURL()})` : "None"}`,
                    });
                }

                if (newMember.user.username != oldMember.user.username) {
                    differences.push({
                        field: "Username",
                        before: oldMember.user.username,
                        after: newMember.user.username,
                    });
                }

                if (newMember.displayName != oldMember.displayName) {
                    differences.push({
                        field: "Display Name",
                        before: oldMember.displayName,
                        after: newMember.displayName,
                    });
                }

                if (newMember.nickname != oldMember.nickname) {
                    differences.push({
                        field: "Nickname",
                        before: oldMember.nickname ?? oldMember.displayName,
                        after: newMember.nickname ?? newMember.displayName,
                    });
                }

                const newRoles = newMember.roles.cache.toJSON();
                const oldRoles = oldMember.roles.cache.toJSON();

                const added = newRoles.filter(v => !oldRoles.includes(v));
                const removed = oldRoles.filter(v => !newRoles.includes(v));

                let embed = client.simpleEmbed({
                    title: `Member updated`,
                    footer: `User ID: ${newMember.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                    color: EmbedColor.Neutral,
                }).setAuthor({
                    name: oldMember.user.username,
                    iconURL: oldMember.avatarURL() ?? oldMember.user.avatarURL() ?? undefined
                });

                if (differences.length != 0) {
                    embed = embed.addFields(
                        { name: "Before", value: differences.map(v => `**${v.field}**: ${v.before}`).join("\n"), inline: true },
                        { name: "After", value: differences.map(v => `**${v.field}**: ${v.after}`).join("\n"), inline: true },
                    );
                }

                if (added.length != 0 || removed.length != 0) {
                    let rolesText = "";

                    for (const role of added) {
                        rolesText += `<:allow:1309211160104534120> ${role}\n`;
                    }

                    for (const role of removed) {
                        rolesText += `<:deny:1309211182397395007> ${role}\n`;
                    }

                    embed = embed.addFields({ name: "Roles", value: rolesText });
                }

                await logChannel.send({ embeds: [embed] });
            }
        }
    }
};

export default guildMemberUpdate;