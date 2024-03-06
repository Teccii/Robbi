import { Document, Model, model, Schema } from "mongoose";

export interface IAFK extends Document {
    guildId: string;
    userId: string;
    reason: string;
}

const afkSchema = new Schema<IAFK>({
    guildId: String,
    userId: String,
    reason: String,
});

export const AFKModel: Model<IAFK> = model("AFK", afkSchema);