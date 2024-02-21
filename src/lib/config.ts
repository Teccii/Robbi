import { ColorResolvable } from "discord.js";

export default interface ClientConfig {
    ownerId: string;
    embedColors: {
        neutral: ColorResolvable,
        success: ColorResolvable,
        warning: ColorResolvable,
        error: ColorResolvable,
    }
}

export enum EmbedColor {
    Neutral = 1,
    Success = 2,
    Warning = 3,
    Error = 4,
}