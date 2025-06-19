import { Schema, model, Document } from "mongoose";
import { IFood } from "./food.model";
import { IMedicalCenter } from "./medicalCenter.model";

// Este modelo representa la cantidad "real" de un alimento asignado a un centro médico
export interface IFoodActual extends Document {
  food: Schema.Types.ObjectId | IFood;
  medicalCenter: Schema.Types.ObjectId | IMedicalCenter;
  quantity: number;
  date: Date; // Fecha en la que se registra la cantidad real
}

const foodActualSchema = new Schema<IFoodActual>(
  {
    food: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    medicalCenter: {
      type: Schema.Types.ObjectId,
      ref: "MedicalCenter",
      required: true,
    },
    quantity: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export default model<IFoodActual>("FoodActual", foodActualSchema);
