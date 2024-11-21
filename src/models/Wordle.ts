import { Document, Model, model, Schema } from "mongoose";

export interface IWordle extends Document {
    guildId: string;
    userId: string;
    guesses: string[];
    answer: string;
    endsAt: number;
}

const wordleSchema = new Schema<IWordle>({
    guildId: String,
    userId: String,
    guesses: [String],
    answer: String,
    endsAt: Number,
});

export const WordleModel: Model<IWordle> = model("Wordle", wordleSchema);