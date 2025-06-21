// server/src/models/unitOfMeasurement.model.ts
import { Schema, model, Document, Types } from "mongoose"; // Importa 'Types'

export interface IUnitOfMeasurement extends Document {
  _id: Types.ObjectId; // Añade el tipo explícito para _id
  name: string; // Ej: "unidad", "gramos", "litros", "taza"
  symbol?: string; // Ej: "un", "g", "l", "tz" (opcional)
  createdAt: Date; // Añade el tipo explícito para createdAt
  updatedAt: Date; // Añade el tipo explícito para updatedAt
}

const UnitOfMeasurementSchema = new Schema<IUnitOfMeasurement>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    symbol: { type: String, required: false, trim: true },
  },
  { timestamps: true } // Esto añade automáticamente createdAt y updatedAt
);

const UnitOfMeasurement = model<IUnitOfMeasurement>(
  "UnitOfMeasurement",
  UnitOfMeasurementSchema
);

export default UnitOfMeasurement;
