import { ChannelType, Events, GuildChannel } from "discord.js";
import { SettingsModel } from "models/Settings";
import { EmbedColor } from "lib/config";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";

const channelDelete: Event = {
    name: Events.ChannelDelete,
    once: false,
    exec: async (client, channel: GuildChannel) => {
        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(channel.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: channel.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${channel.guild.id})`);

            client.settings.set(channel.guild.id, s);
            channel.settings = s;
        } else {
            const s = client.settings.get(channel.guild.id)!;

            channel.settings = s;
        }

        const logChannelIds = channel.settings.events.filter(v => v.event == "channelDelete").map(v => v.channel);

        for (const id of logChannelIds) {
            const logChannel = await channel.guild.channels.fetch(id);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased() && logChannel.id != channel.id) {
                if (channel.type != ChannelType.GuildText
                    && channel.type != ChannelType.GuildVoice
                    && channel.type != ChannelType.GuildForum
                    && channel.type != ChannelType.GuildAnnouncement
                    && channel.type != ChannelType.GuildCategory) {
                    return;
                }

                let title: string;
                let footer: string;

                if (channel.type == ChannelType.GuildCategory) {
                    footer = `Category ID: ${channel.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`;
                } else {
                    footer = `Channel ID: ${channel.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`;
                }

                switch (channel.type) {
                    case ChannelType.GuildText: {
                        title = `Text channel "${channel.name}" deleted`;
                        break;
                    }

                    case ChannelType.GuildVoice: {
                        title = `Voice channel "${channel.name}" deleted`;
                        break;
                    }

                    case ChannelType.GuildForum: {
                        title = `Forum channel "${channel.name}" deleted`;
                        break;
                    }

                    case ChannelType.GuildAnnouncement: {
                        title = `News channel "${channel.name}" deleted`;
                        break;
                    }

                    case ChannelType.GuildCategory: {
                        title = `Category "${channel.name}" deleted`;
                        break;
                    }
                }

                let embed = client.simpleEmbed({
                    title: title,
                    footer: footer,
                    color: EmbedColor.Error
                });

                if (channel.parent) {
                    embed = embed.addFields({ name: "Category", value: `${channel.parent.name}` });
                }

                await logChannel.send({
                    embeds: [embed]
                });
            }
        }
    }
};

export default channelDelete;