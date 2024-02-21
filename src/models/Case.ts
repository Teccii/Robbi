import { Document, Model, model, Schema } from "mongoose";

export enum CaseType {
    Ban = "Ban",
    Mute = "Mute",
    Warn = "Warn",
}

export interface ICase extends Document {
    caseNumber: number;
    caseType: CaseType;
    guildId: string;
    moderatorId: string;
    targetId: string;
    reason: string;
    duration?: number;
    expired?: boolean;
    expiresAt?: number;
    createdAt: number;
}

const caseSchema = new Schema<ICase>(
    {
        caseNumber: Number,
        caseType: { type: String, enum: CaseType },
        guildId: String,
        moderatorId: String,
        targetId: String,
        reason: String,
        duration: Number,
        expired: Boolean,
        expiresAt: Number,
    },
    { timestamps: true }
);

export const CaseModel: Model<ICase> = model("Case", caseSchema);