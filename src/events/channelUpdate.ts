import {
    ChannelType,
    EmbedBuilder,
    Events,
    GuildChannel,
    OverwriteType
} from "discord.js";
import { SettingsModel } from "models/Settings";
import { EmbedColor } from "lib/config";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";

const channelUpdate: Event = {
    name: Events.ChannelUpdate,
    once: false,
    exec: async (client, oldChannel: GuildChannel, newChannel: GuildChannel) => {
        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(newChannel.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: newChannel.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${newChannel.guild.id})`);

            client.settings.set(newChannel.guild.id, s);
            oldChannel.settings = s;
            newChannel.settings = s;
        } else {
            const s = client.settings.get(newChannel.guild.id)!;

            oldChannel.settings = s;
            newChannel.settings = s;
        }

        const logChannelIds = newChannel.settings.events.filter(v => v.event == "channelUpdate").map(v => v.channel);

        for (const id of logChannelIds) {
            const logChannel = await newChannel.guild.channels.fetch(id);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased() && logChannel.id != newChannel.id) {
                let differences: {
                    field: string,
                    before: string,
                    after: string
                }[] = [];

                if (newChannel.name != oldChannel.name) {
                    differences.push({
                        field: "Name",
                        before: oldChannel.name,
                        after: newChannel.name,
                    });
                }

                if (newChannel.parentId != oldChannel.parentId) {
                    differences.push({
                        field: "Category",
                        before: `${oldChannel.parent}`,
                        after: `${newChannel.parent}`,
                    });
                }

                if (newChannel.position != oldChannel.position) {
                    differences.push({
                        field: "Position",
                        before: oldChannel.position.toString(),
                        after: newChannel.position.toString(),
                    });
                }

                let permUpdates: {
                    name: string,
                    allow: string[],
                    neutral: string[],
                    deny: string[],
                }[] = [];

                for (const [key, overwrites] of newChannel.permissionOverwrites.cache) {
                    const oldOverwrites = oldChannel.permissionOverwrites.cache.get(key);

                    let allow: string[] = [];
                    let neutral: string[] = [];
                    let deny: string[] = [];

                    if (oldOverwrites) {
                        const newAllow = overwrites.allow;
                        const newDeny = overwrites.deny;
                        const oldAllow = oldOverwrites.allow;
                        const oldDeny = oldOverwrites.deny;

                        allow = newAllow.toArray().filter(v => !oldAllow.has(v));
                        deny = newDeny.toArray().filter(v => !oldDeny.has(v));
                        neutral = oldAllow.toArray().concat(oldDeny.toArray()).filter(v => !newAllow.has(v) && !newDeny.has(v));
                    } else {
                        allow = overwrites.allow.toArray();
                        deny = overwrites.deny.toArray();
                    }

                    if (allow.length == 0 && neutral.length == 0 && deny.length == 0) {
                        continue;
                    }

                    if (overwrites.type == OverwriteType.Member) {
                        permUpdates.push({
                            name: (await newChannel.guild.members.fetch(key)).user.username,
                            allow: allow,
                            neutral: neutral,
                            deny: deny,
                        });
                    } else {
                        permUpdates.push({
                            name: (await newChannel.guild.roles.fetch(key))!.name,
                            allow: allow,
                            neutral: neutral,
                            deny: deny,
                        });
                    }
                }

                let embed: EmbedBuilder;

                if (newChannel.type == ChannelType.GuildCategory) {
                    embed = client.simpleEmbed({
                        title: `Category "${oldChannel.name}" updated`,
                        footer: `Category ID: ${newChannel.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Neutral,
                    });
                } else {
                    embed = client.simpleEmbed({
                        title: `Channel "${oldChannel.name}" updated`,
                        footer: `Channel ID: ${newChannel.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Neutral,
                    });
                }

                if (differences.length != 0) {
                    embed = embed.addFields(
                        { name: "Before", value: differences.map(v => `**${v.field}**: ${v.before}`).join("\n"), inline: true },
                        { name: "After", value: differences.map(v => `**${v.field}**: ${v.after}`).join("\n"), inline: true },
                    );
                }

                permUpdates.forEach(updates => {
                    let text = "";

                    for (const perm of updates.allow) {
                        text += `<:allow:1208121658506874910> ${perm}\n`;
                    }

                    for (const perm of updates.neutral) {
                        text += `<:neutral:1208121654744584203> ${perm}\n`;
                    }

                    for (const perm of updates.deny) {
                        text += `<:deny:1208121656640282634> ${perm}\n`;
                    }

                    embed = embed.addFields({ name: `Permissions for ${updates.name}`, value: text });
                });

                await logChannel.send({ embeds: [embed] });
            }
        }
    }
};

export default channelUpdate;