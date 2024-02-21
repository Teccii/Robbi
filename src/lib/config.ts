import { ColorResolvable, GuildMember } from "discord.js";

export default interface ClientConfig {
    ownerId: string;
    embedColors: {
        neutral: ColorResolvable,
        success: ColorResolvable,
        warning: ColorResolvable,
        error: ColorResolvable,
    };
    permLevels: {
        name: string;
        level: number;
        check: (member: GuildMember | undefined | null) => boolean;
    }[];
}

export enum EmbedColor {
    Neutral = 1,
    Success = 2,
    Warning = 3,
    Error = 4,
}