// server/src/models/foodEntry.model.ts
import { Schema, model, Document, Types } from "mongoose";
import { IMedicalCenter } from "./medicalCenter.model";
import { IProvider } from "./provider.model";
import { IFood } from "./food.model";
import { IFoodPlan } from "./foodPlan.model"; // Importar el modelo de Plan de Alimentos

// Interfaz para los detalles de alimentos en una entrada
export interface IEnteredFood {
  food: Types.ObjectId | IFood;
  quantity: number;
}

export interface IFoodEntry extends Document {
  medicalCenter: Types.ObjectId | IMedicalCenter;
  provider: Types.ObjectId | IProvider;
  foodPlan: Types.ObjectId | IFoodPlan; // Vínculo directo al plan específico
  entryDate: Date;
  enteredFoods: IEnteredFood[]; // Array de alimentos y cantidades en esta entrada
  createdAt: Date;
  updatedAt: Date;
}

const EnteredFoodSchema = new Schema<IEnteredFood>(
  {
    food: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      max: 10000000000, // Diez mil millones
    },
  },
  { _id: false } // No crear un _id para subdocumentos
);

const FoodEntrySchema = new Schema<IFoodEntry>(
  {
    medicalCenter: {
      type: Schema.Types.ObjectId,
      ref: "MedicalCenter",
      required: true,
    },
    provider: { type: Schema.Types.ObjectId, ref: "Provider", required: true },
    foodPlan: { type: Schema.Types.ObjectId, ref: "FoodPlan", required: true }, // Referencia obligatoria a un plan
    entryDate: { type: Date, required: true, default: Date.now },
    enteredFoods: { type: [EnteredFoodSchema], default: [] }, // Array de subdocumentos
  },
  { timestamps: true }
);

const FoodEntry = model<IFoodEntry>("FoodEntry", FoodEntrySchema);

export default FoodEntry;
