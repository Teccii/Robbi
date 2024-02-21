import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Guild } from "discord.js";
import { IPoll, PollModel } from "models/Poll";
import { EmbedColor } from "./config";
import CustomClient from "./client";

export async function endPoll(client: CustomClient, guild: Guild, poll: IPoll, manual: boolean) {
    const channel = await guild.channels.fetch(poll.channelId);

    if (channel && !channel.isDMBased() && channel.isTextBased()) {
        const message = await channel.messages.fetch(poll.messageId);
        const options = message.components[0].components.map(v => {
            if (v.type == ComponentType.Button) {
                return new ButtonBuilder()
                    .setDisabled(true)
                    .setCustomId(v.customId!)
                    .setEmoji(v.emoji!)
                    .setLabel(v.label!)
                    .setStyle(ButtonStyle.Primary)
            } else {
                return new ButtonBuilder()
                    .setLabel("Unknown")
                    .setDisabled(true)
                    .setStyle(ButtonStyle.Secondary);
            }
        });

        const embed = message.embeds[0];
        const voted = poll.votes.map((v, i) => ({ value: v, index: i })).sort((a, b) => b.value - a.value);

        let result = "";

        for (const option of voted) {
            const component = message.components[0].components.at(option.index);

            if (component) {
                const data = component.data;

                if (data.type == ComponentType.Button) {
                    const emoji = client.emojis.cache.find(v => v.id == data.emoji?.id) ?? data.emoji?.name;

                    result += `**${option.value}** ${emoji} ${data.label}\n`;
                } else {
                    result += `:warning: Unable to retrieve data for this option\n`;
                }
            }
        }

        if (voted.length == 0) {
            result = `:warning: Unable to retrieve results`;
        }

        if (manual) {
            await message.edit({
                embeds: [client.simpleEmbed({
                    title: "Poll",
                    footer: "This poll was ended manually",
                    color: EmbedColor.Neutral,
                }).setFields(
                    embed.fields[0],
                    { name: "Ended", value: `<t:${Math.trunc(Date.now() / 1000)}:f>` },
                    { name: "Result", value: result },
                )],
                components: [new ActionRowBuilder<ButtonBuilder>().setComponents(options)]
            });
        } else {
            await message.edit({
                embeds: [client.simpleEmbed({
                    title: "Poll",
                    color: EmbedColor.Neutral,
                }).setFields(
                    embed.fields[0],
                    { name: "Ended", value: `<t:${Math.trunc(Date.now() / 1000)}:f>` },
                    { name: "Result", value: result },
                )],
                components: [new ActionRowBuilder<ButtonBuilder>().setComponents(options)]
            });
        }

        await PollModel.deleteOne({ guildId: guild.id, pollId: poll.pollId });
    }
}