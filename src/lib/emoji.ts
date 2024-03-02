import { parseEmoji } from "discord.js";
import emojiRegex from "emoji-regex";

export function hasEmoji(str: string): boolean {
    return Boolean(str.match(emojiRegex()) || str.match(/<a:.+?:\d+>|<:.+?:\d+>/));
}

export function extractEmojis(str: string): string[] | null {
    return str.match(/<a:.+?:\d+>|<:.+?:\d+>/g);
}

export function getEmojiUrl(emoji: string): string | null {
    const parsedEmoji = parseEmoji(emoji);

    if (parsedEmoji?.id) {
        const extension = parsedEmoji.animated ? ".gif" : ".png";

        return `https://cdn.discordapp.com/emojis/${parsedEmoji.id}${extension}`;
    } else {
        return null;
    }
}