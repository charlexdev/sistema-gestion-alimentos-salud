import { Schema, model, Document } from "mongoose";
import { IFood } from "./food.model";
import { IMedicalCenter } from "./medicalCenter.model";

export interface IPlan extends Document {
  food: Schema.Types.ObjectId | IFood;
  medicalCenter: Schema.Types.ObjectId | IMedicalCenter;
  quantity: number;
  date: Date;
  planType: "daily" | "weekly" | "monthly" | "annual"; // Tipo de plan
}

const planSchema = new Schema<IPlan>(
  {
    food: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    medicalCenter: {
      type: Schema.Types.ObjectId,
      ref: "MedicalCenter",
      required: true,
    },
    quantity: { type: Number, required: true },
    date: { type: Date, required: true }, // Fecha a la que corresponde el plan
    planType: {
      type: String,
      enum: ["daily", "weekly", "monthly", "annual"],
      required: true,
    },
  },
  { timestamps: true }
);

export default model<IPlan>("Plan", planSchema);
