import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, Message } from "discord.js";
import { SettingsModel } from "models/Settings";
import { EmbedColor } from "lib/config";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";
import { StarboardMessageModel } from "models/StarboardMessage";

const messageDelete: Event = {
    name: Events.MessageDelete,
    once: false,
    exec: async (client, message: Message) => {
        if (!message.content || !message.guild || !message.author || message.author.bot) {
            return;
        }

        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(message.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: message.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${message.guild.id})`);

            client.settings.set(message.guild.id, s);
            message.settings = s;
        } else {
            const s = client.settings.get(message.guild.id)!;

            message.settings = s;
        }

        const starboardMessages = await StarboardMessageModel.find({
            guildId: message.guild.id,
            originalMessageId: message.id,
        });

        for (const _starboardMessage of starboardMessages) {
            const starboard = message.settings.starboards.find(v => v.id == _starboardMessage.starboardId);

            if (starboard) {
                const channel = await message.guild.channels.fetch(starboard.channel);

                if (channel && !channel.isDMBased() && channel.isTextBased() && channel.id != message.channel.id) {
                    const starboardMessage = await channel.messages.fetch(_starboardMessage.starboardMessageId);

                    await StarboardMessageModel.deleteOne({
                        guildId: message.guild.id,
                        starboardId: starboard.id,
                        originalMessageId: message.id,
                    });

                    await starboardMessage.delete();
                }
            }
        }

        const logChannelIds = message.settings.events.filter(v => v.event == "messageDelete").map(v => v.channel);

        for (const id of logChannelIds) {
            const logChannel = await message.guild.channels.fetch(id);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased() && logChannel.id != message.channel.id) {
                let embeds = [client.simpleEmbed({
                    title: `Message deleted`,
                    footer: `User ID: ${message.author.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                    color: EmbedColor.Error,
                }).setFields(
                    { name: "Channel", value: `${message.channel}`, inline: true },
                    { name: "Message Sent", value: `<t:${Math.trunc(message.createdTimestamp / 1000)}:f>`, inline: true },
                    { name: "Content", value: `\`\`\`${message.content}\`\`\`` },
                ).setAuthor({
                    name: `${message.author.username}`,
                    iconURL: message.author.avatarURL() ?? undefined
                })];

                const components: ActionRowBuilder<ButtonBuilder>[] = [];

                let i = 1;
                for (const [, attachment] of message.attachments) {
                    if (attachment.contentType?.includes("image/")) {
                        embeds.push(client.simpleEmbed({
                            title: `Attachment ${i}`,
                            color: EmbedColor.Error
                        }).setImage(attachment.url));

                        i++;
                    } else if (attachment.contentType?.includes("video/")) {
                        components.push(new ActionRowBuilder<ButtonBuilder>().addComponents([
                            new ButtonBuilder()
                                .setLabel(attachment.name)
                                .setStyle(ButtonStyle.Link)
                                .setURL(attachment.url)
                        ]));
                    }
                }

                await logChannel.send({
                    embeds,
                    components,
                });
            }
        }
    }
};

export default messageDelete;