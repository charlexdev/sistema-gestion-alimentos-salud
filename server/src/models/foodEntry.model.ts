// server/src/models/foodEntry.model.ts
import { Schema, model, Document, Types } from "mongoose";
import { IFood } from "./food.model";
import { IMedicalCenter } from "./medicalCenter.model";
import { IProvider } from "./provider.model"; // <-- Importar la interfaz de Proveedor

// Interfaz para cada item de alimento dentro de un registro de entrada
export interface IFoodEntryItem {
  food: Types.ObjectId | IFood; // Referencia al ID del alimento
  quantity: number; // Cantidad de ese alimento que entra
}

// Interfaz para el Registro de Entrada de Alimentos
export interface IFoodEntry extends Document {
  name: string; // Nombre/descripción de la entrada (ej. "Entrega Semanal Hospital Pediátrico")
  date: Date; // Fecha en que se realizó la entrada
  medicalCenter: Types.ObjectId | IMedicalCenter; // Centro médico que recibe la entrada
  provider: Types.ObjectId | IProvider; // Proveedor de la entrada
  entryItems: IFoodEntryItem[]; // Array de ítems de alimentos entrantes
}

const FoodEntryItemSchema = new Schema<IFoodEntryItem>(
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

const FoodEntrySchema = new Schema<IFoodEntry>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    medicalCenter: {
      type: Schema.Types.ObjectId,
      ref: "MedicalCenter",
      required: true,
    },
    provider: {
      // <-- Referencia al modelo de Proveedor
      type: Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },
    entryItems: [FoodEntryItemSchema],
  },
  { timestamps: true }
);

const FoodEntry = model<IFoodEntry>("FoodEntry", FoodEntrySchema);

export default FoodEntry;
