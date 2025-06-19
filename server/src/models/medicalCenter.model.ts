import { Schema, model, Document } from "mongoose";

export interface IMedicalCenter extends Document {
  name: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
}

const medicalCenterSchema = new Schema<IMedicalCenter>(
  {
    name: { type: String, required: true, unique: true },
    address: { type: String },
    contactPerson: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

export default model<IMedicalCenter>("MedicalCenter", medicalCenterSchema);
