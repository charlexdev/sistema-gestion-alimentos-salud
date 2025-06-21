// server/src/models/food.model.ts (VERSIÓN FINAL CON REFERENCIA A UNIDAD)
import { Schema, model, Document, Types } from "mongoose"; // Importar Types
import { IUnitOfMeasurement } from "./unitOfMeasurement.model"; // Importar la interfaz de la unidad

export interface IFood extends Document {
  name: string;
  // CAMBIO CLAVE AQUÍ: unitOfMeasurement ahora es un ObjectId que referencia a IUnitOfMeasurement
  unitOfMeasurement: Types.ObjectId | IUnitOfMeasurement;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const FoodSchema = new Schema<IFood>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    // CAMBIO CLAVE AQUÍ: Definición del campo para referenciar
    unitOfMeasurement: {
      type: Schema.Types.ObjectId, // El tipo es ObjectId
      ref: "UnitOfMeasurement", // Hace referencia al modelo 'UnitOfMeasurement'
      required: true, // Sigue siendo requerido
    },
    description: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

const Food = model<IFood>("Food", FoodSchema);

export default Food;
