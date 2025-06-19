import { Schema, model, Document } from "mongoose";
import { IFood } from "./food.model";
import { IMedicalCenter } from "./medicalCenter.model";
import { ISupplier } from "./supplier.model";

export interface IEntry extends Document {
  food: Schema.Types.ObjectId | IFood;
  medicalCenter: Schema.Types.ObjectId | IMedicalCenter;
  supplier: Schema.Types.ObjectId | ISupplier;
  quantity: number;
  entryDate: Date;
}

const entrySchema = new Schema<IEntry>(
  {
    food: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    medicalCenter: {
      type: Schema.Types.ObjectId,
      ref: "MedicalCenter",
      required: true,
    },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    quantity: { type: Number, required: true },
    entryDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export default model<IEntry>("Entry", entrySchema);
