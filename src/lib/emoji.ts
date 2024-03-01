import emojiRegex from "emoji-regex";

export function hasEmoji(str: string): boolean {
    return Boolean(str.match(emojiRegex()) || str.match(/<a:.+?:\d+>|<:.+?:\d+>/));
}

export function extractEmojis(str: string): string[] | null {
    return str.match(/<a:.+?:\d+>|<:.+?:\d+>/g);
}