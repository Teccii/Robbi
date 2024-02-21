import { Document, Model, model, Schema } from "mongoose";

export interface IStarboardMessage extends Document {
    guildId: string;
    starboardId: string;
    originalMessageId: string;
    starboardMessageId: string;
}

const starboardMessageSchema = new Schema<IStarboardMessage>({
    guildId: String,
    starboardId: String,
    originalMessageId: String,
    starboardMessageId: String,
});

export const StarboardMessageModel: Model<IStarboardMessage> = model("StarboardMessage", starboardMessageSchema);