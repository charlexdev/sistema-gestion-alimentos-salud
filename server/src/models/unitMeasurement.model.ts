import { Schema, model, Document } from "mongoose";

export interface IUnitMeasurement extends Document {
  name: string; // Ej. "kg", "libras", "unidades"
}

const unitMeasurementSchema = new Schema<IUnitMeasurement>(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default model<IUnitMeasurement>(
  "UnitMeasurement",
  unitMeasurementSchema
);
