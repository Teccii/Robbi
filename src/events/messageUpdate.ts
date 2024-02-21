import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, Message } from "discord.js";
import { SettingsModel } from "models/Settings";
import { EmbedColor } from "lib/config";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";
import { StarboardMessageModel } from "models/StarboardMessage";
import { getStarboardMessage } from "lib/starboard";

const messageUpdate: Event = {
    name: Events.MessageUpdate,
    once: false,
    exec: async (client, oldMessage: Message, newMessage: Message) => {
        if (!newMessage.content || !newMessage.guild || !newMessage.author || newMessage.author.bot) {
            return;
        }

        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(newMessage.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: newMessage.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${newMessage.guild.id})`);

            client.settings.set(newMessage.guild.id, s);

            oldMessage.settings = s;
            newMessage.settings = s;
        } else {
            const s = client.settings.get(newMessage.guild.id)!;

            oldMessage.settings = s;
            newMessage.settings = s;
        }

        const starboardMessages = await StarboardMessageModel.find({
            guildId: newMessage.guild.id,
            originalMessageId: newMessage.id,
        });

        for (const _starboardMessage of starboardMessages) {
            const starboard = newMessage.settings.starboards.find(v => v.id == _starboardMessage.starboardId);

            if (starboard) {
                const channel = await newMessage.guild.channels.fetch(starboard.channel);

                if (channel && !channel.isDMBased() && channel.isTextBased() && channel.id != newMessage.channel.id) {
                    const starboardMessage = await channel.messages.fetch(_starboardMessage.starboardMessageId);
                    const payload = getStarboardMessage(
                        client,
                        newMessage,
                        starboard.emoji
                    );

                    await starboardMessage.edit(payload);
                }
            }
        }

        const logChannelIds = newMessage.settings.events.filter(v => v.event == "messageUpdate").map(v => v.channel);

        for (const id of logChannelIds) {
            const logChannel = await newMessage.guild.channels.fetch(id);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased() && logChannel.id != newMessage.channel.id) {
                const component = new ActionRowBuilder<ButtonBuilder>().addComponents([
                    new ButtonBuilder()
                        .setLabel("Message")
                        .setStyle(ButtonStyle.Link)
                        .setURL(newMessage.url)
                ]);

                await logChannel.send({
                    embeds: [client.simpleEmbed({
                        title: `Message updated`,
                        footer: `User ID: ${newMessage.author.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Neutral,
                    }).setFields(
                        { name: "Message Sent", value: `<t:${Math.trunc(newMessage.createdTimestamp / 1000)}:f>` },
                        { name: "Old Content", value: `\`\`\`${oldMessage.content}\`\`\`` },
                        { name: "New Content", value: `\`\`\`${newMessage.content}\`\`\`` },
                    ).setAuthor({
                        name: newMessage.author.username,
                        iconURL: newMessage.author.avatarURL() ?? undefined
                    })],
                    components: [component]
                });
            }
        }
    }
};

export default messageUpdate;