import { Document, Model, model, Schema } from "mongoose";

export enum AnnouncementType {
    Never = "Never",
    RewardsOnly = "RewardsOnly",
    EveryFive = "EveryFive",
    EveryTen = "EveryTen",
    EveryFiveAndRewards = "EveryFiveAndRewards",
    EveryTenAndRewards = "EveryTenAndRewards",
    Always = "Always",
}

export enum ContentFilter {
    None = "None",
    Low = "Low",
    Medium = "Medium",
    High = "High",
}

export interface ISettings extends Document {
    ai: {
        channels: string[];
        contentFilter: ContentFilter;
        temperature: number;
        prompt: string;
    }
    leveling: {
        levelRoles: {
            level: number;
            role: string;
        }[];
        removePastRoles: boolean;
        announcements: AnnouncementType;
        messageMin: number;
        messageMax: number;
        messageCooldown: number;
        replyMin: number;
        replyMax: number;
        replyCooldown: number;
    };
    staffRoles: {
        moderator?: string;
        admin?: string;
    };
    rules: {
        title: string;
        description: string;
    }[];
    starboards: {
        id: string;
        emoji: string,
        channel: string;
        threshold: number;
    }[];
    wildcards: {
        id: string;
        title: string;
        description: string;
    }[];
    events: {
        event: string;
        channel: string;
    }[];
    staffApplyChannel?: string;
    ticketCategory?: string;
    createdAt: number;
    updatedAt: number;
    toUpdate: boolean;
}

const settingsSchema = new Schema<ISettings>(
    {
        _id: String,
        ai: {
            channels: [String],
            contentFilter: { type: ContentFilter, default: ContentFilter.High },
            temperature: { type: Number, default: 1.0 },
            prompt: { type: String, default: "" },
        },
        leveling: {
            levelRoles: [{
                level: Number,
                role: String,
            }],
            removePastRoles: { type: Boolean, default: true },
            announcements: { type: AnnouncementType, default: AnnouncementType.Always },
            messageMin: { type: Number, default: 15 },
            messageMax: { type: Number, default: 40 },
            messageCooldown: { type: Number, default: 60 },
            replyMin: { type: Number, default: 5 },
            replyMax: { type: Number, default: 25 },
            replyCooldown: { type: Number, default: 45 },
        },
        staffRoles: {
            moderator: String,
            admin: String,
        },
        rules: [{
            title: String,
            description: String,
        }],
        starboards: [{
            id: String,
            emoji: String,
            channel: String,
            threshold: { type: Number, default: 10 },
        }],
        wildcards: [{
            id: String,
            title: String,
            description: String,
        }],
        events: [{
            event: String,
            channel: String,
        }],
        staffApplyChannel: String,
        ticketCategory: String,
        toUpdate: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

export const SettingsModel: Model<ISettings> = model("Settings", settingsSchema);