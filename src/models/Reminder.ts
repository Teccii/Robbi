import { Document, Model, model, Schema } from "mongoose";

export interface IReminder extends Document {
    guildId: string;
    userId: string;
    reason: string;
    duration: number;
    expiresAt: number;
    createdAt: number;
}

const reminderSchema = new Schema<IReminder>(
    {
        guildId: String,
        userId: String,
        reason: String,
        duration: Number,
        expiresAt: Number,
    },
    { timestamps: true }
);

export const ReminderModel: Model<IReminder> = model("Reminder", reminderSchema);