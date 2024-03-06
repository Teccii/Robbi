import { Document, Model, model, Schema } from "mongoose";

export interface ICooldown extends Document {
    duration: number;
    endsAt: number;
}

const cooldownSchema = new Schema<ICooldown>({
    _id: String,
    duration: Number,
    endsAt: Number,
});

export const CooldownModel: Model<ICooldown> = model("Cooldown", cooldownSchema);