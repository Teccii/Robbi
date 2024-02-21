import { Document, Model, model, Schema } from "mongoose";

export interface ILevel extends Document {
    guildId: string;
    userId: string;
    cachedLevel: number;
    xp: number;
}

const levelSchema = new Schema<ILevel>({
    guildId: String,
    userId: String,
    cachedLevel: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
});

export const LevelModel: Model<ILevel> = model("Level", levelSchema);