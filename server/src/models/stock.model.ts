// server/src/models/stock.model.ts
import { Schema, model, Document, Types } from "mongoose";
import { IMedicalCenter } from "./medicalCenter.model";
import { IFood } from "./food.model";

export interface IStock extends Document {
  medicalCenter: Types.ObjectId | IMedicalCenter;
  food: Types.ObjectId | IFood;
  quantity: number; // Cantidad actual en stock
  updatedAt: Date; // Usamos solo updatedAt aquí, ya que createdAt no es tan relevante para un stock que siempre cambia
}

const StockSchema = new Schema<IStock>(
  {
    medicalCenter: {
      type: Schema.Types.ObjectId,
      ref: "MedicalCenter",
      required: true,
    },
    food: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    quantity: { type: Number, required: true, default: 0, min: 0 }, // Empieza en 0, no puede ser negativo
  },
  { timestamps: true } // Mongoose añadirá createdAt y updatedAt. updatedAt es clave aquí.
);

// Crear un índice compuesto para asegurar unicidad por centro médico y alimento
StockSchema.index({ medicalCenter: 1, food: 1 }, { unique: true });

const Stock = model<IStock>("Stock", StockSchema);

export default Stock;
