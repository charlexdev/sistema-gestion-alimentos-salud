import { Schema, model, Document, Types } from "mongoose";
import { IUnitOfMeasurement } from "./unitOfMeasurement.model";

export interface IFood extends Document {
  name: string;
  unitOfMeasurement: Types.ObjectId | IUnitOfMeasurement;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const FoodSchema = new Schema<IFood>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    unitOfMeasurement: {
      type: Schema.Types.ObjectId,
      ref: "UnitOfMeasurement",
      required: true,
    },
    description: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

const Food = model<IFood>("Food", FoodSchema);

export default Food;
