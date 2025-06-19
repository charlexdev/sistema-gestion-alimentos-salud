import { Schema, model, Document } from "mongoose";
import { IFood } from "./food.model";
import { IMedicalCenter } from "./medicalCenter.model";

export interface IStock extends Document {
  food: Schema.Types.ObjectId | IFood;
  medicalCenter: Schema.Types.ObjectId | IMedicalCenter;
  quantity: number;
  lastUpdate: Date;
}

const stockSchema = new Schema<IStock>(
  {
    food: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    medicalCenter: {
      type: Schema.Types.ObjectId,
      ref: "MedicalCenter",
      required: true,
    },
    quantity: { type: Number, required: true, default: 0 },
    lastUpdate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model<IStock>("Stock", stockSchema);
