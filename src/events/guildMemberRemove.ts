import { SettingsModel } from "models/Settings";
import { Events, GuildMember } from "discord.js";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";
import { EmbedColor } from "lib/config";

const guildMemberRemove: Event = {
    name: Events.GuildMemberRemove,
    once: false,
    exec: async (client, member: GuildMember) => {
        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(member.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: member.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${member.guild.id})`);

            client.settings.set(member.guild.id, s);
            member.settings = s;
        } else {
            const s = client.settings.get(member.guild.id)!;

            member.settings = s;
        }

        const logChannelIds = member.settings.events.filter(v => v.event == "guildMemberRemove").map(v => v.channel);

        for (const id of logChannelIds) {
            const logChannel = await member.guild.channels.fetch(id);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
                await logChannel.send({
                    embeds: [client.simpleEmbed({
                        title: `Member left`,
                        footer: `User ID: ${member.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Error
                    }).setAuthor({
                        name: member.user.username,
                        iconURL: member.avatarURL() ?? member.user.avatarURL() ?? undefined
                    })]
                });
            }
        }
    }
};

export default guildMemberRemove;