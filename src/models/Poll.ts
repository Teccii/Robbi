import { Document, Model, model, Schema } from "mongoose";

export interface IPoll extends Document {
    guildId: string;
    pollId: string;
    channelId: string;
    messageId: string;
    endsAt: number;
    votes: number[];
    voted: string[];
}

const pollSchema = new Schema<IPoll>({
    guildId: String,
    pollId: String,
    channelId: String,
    messageId: String,
    endsAt: Number,
    votes: [Number],
    voted: [String],
});

export const PollModel: Model<IPoll> = model("Poll", pollSchema);