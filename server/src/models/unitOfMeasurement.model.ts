import { Schema, model, Document, Types } from "mongoose";

export interface IUnitOfMeasurement extends Document {
  _id: Types.ObjectId;
  name: string;
  symbol?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UnitOfMeasurementSchema = new Schema<IUnitOfMeasurement>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    symbol: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

const UnitOfMeasurement = model<IUnitOfMeasurement>(
  "UnitOfMeasurement",
  UnitOfMeasurementSchema
);

export default UnitOfMeasurement;
