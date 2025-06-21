// server/src/models/plan.model.ts (¡Volver a esta versión, sin actualQuantity en IPlanFoodItem!)
import { Schema, model, Document, Types } from "mongoose";
import { IFood } from "./food.model";
import { IMedicalCenter } from "./medicalCenter.model";

export interface IPlanFoodItem {
  food: Types.ObjectId | IFood;
  quantity: number; // Cantidad PLANIFICADA
}

export interface IPlan extends Document {
  name: string;
  date: Date;
  medicalCenter: Types.ObjectId | IMedicalCenter;
  foodItems: IPlanFoodItem[];
}

const PlanFoodItemSchema = new Schema<IPlanFoodItem>(
  {
    food: {
      type: Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    medicalCenter: {
      type: Schema.Types.ObjectId,
      ref: "MedicalCenter",
      required: true,
    },
    foodItems: [PlanFoodItemSchema],
  },
  { timestamps: true }
);

const Plan = model<IPlan>("Plan", PlanSchema);

export default Plan;
