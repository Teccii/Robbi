import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Message
} from "discord.js";
import CustomClient from "./client";
import { EmbedColor } from "./config";
import dayjs from "dayjs";

export function getStarboardMessage(
    client: CustomClient,
    message: Message,
    emoji: string,
    reactionCount?: number,
): { embeds: EmbedBuilder[], components: ActionRowBuilder<any>[] } {
    const _reactionCount = reactionCount ?? message.reactions.cache.find(e => e.emoji.toString() == emoji)!.count;

    const embeds = [client.simpleEmbed({
        title: `${emoji} ${_reactionCount}`,
        description: message.content ?? undefined,
        footer: `Message ID: ${message.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
        color: EmbedColor.Neutral,
    }).setAuthor({
        name: message.author.username,
        iconURL: message.author.avatarURL() ?? undefined
    })];

    const components = [new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setLabel("Original Message")
            .setStyle(ButtonStyle.Link)
            .setURL(message.url)
    ])];

    for (const [, attachment] of message.attachments) {
        if (attachment.contentType?.includes("image/")) {
            embeds.push(client.simpleEmbed({
                color: EmbedColor.Neutral
            }).setImage(attachment.url));
        } else if (attachment.contentType?.includes("video/") || attachment.contentType?.includes("audio/")) {
            components.push(new ActionRowBuilder<ButtonBuilder>().addComponents([
                new ButtonBuilder()
                    .setLabel(attachment.name)
                    .setStyle(ButtonStyle.Link)
                    .setURL(attachment.url)
            ]));
        }
    }

    return { embeds, components };
}