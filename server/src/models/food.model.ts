import { Schema, model, Document } from "mongoose";
import { IUnitMeasurement } from "./unitMeasurement.model"; // Importar la interfaz

export interface IFood extends Document {
  name: string;
  unitOfMeasurement: Schema.Types.ObjectId | IUnitMeasurement; // Referencia a UnitMeasurement
}

const foodSchema = new Schema<IFood>(
  {
    name: { type: String, required: true, unique: true },
    unitOfMeasurement: {
      type: Schema.Types.ObjectId,
      ref: "UnitMeasurement",
      required: true,
    },
  },
  { timestamps: true }
);

export default model<IFood>("Food", foodSchema);
