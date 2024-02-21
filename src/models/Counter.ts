import { Document, Model, model, Schema } from "mongoose";

export interface ICounter extends Document {
    index: number;
}

const counterSchema = new Schema<ICounter>({
    _id: String,
    index: { type: Number, default: 0 }
});

export const CounterModel: Model<ICounter> = model("Counter", counterSchema);