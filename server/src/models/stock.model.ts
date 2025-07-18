import { Schema, model, Document, Types } from "mongoose";
import { IMedicalCenter } from "./medicalCenter.model";
import { IFood } from "./food.model";

export interface IStock extends Document {
  medicalCenter: Types.ObjectId | IMedicalCenter;
  food: Types.ObjectId | IFood;
  quantity: number;
  updatedAt: Date;
}

const StockSchema = new Schema<IStock>(
  {
    medicalCenter: {
      type: Schema.Types.ObjectId,
      ref: "MedicalCenter",
      required: true,
    },
    food: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

StockSchema.index({ medicalCenter: 1, food: 1 }, { unique: true });

const Stock = model<IStock>("Stock", StockSchema);

export default Stock;
