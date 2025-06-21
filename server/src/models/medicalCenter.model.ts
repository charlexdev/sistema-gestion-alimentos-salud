// server/src/models/medicalCenter.model.ts
import { Schema, model, Document } from "mongoose";

export interface IMedicalCenter extends Document {
  name: string; // Ej: "Hospital General", "Clínica Municipal"
  address?: string; // Ej: "Calle Principal #123" (opcional)
  contactInfo?: string; // Ej: "Tel: 555-1234, Email: info@hospital.com" (opcional)
  createdAt?: Date; // <--- AGREGADO: Para que TypeScript reconozca la propiedad
  updatedAt?: Date; // <--- AGREGADO: Para que TypeScript reconozca la propiedad
}

const MedicalCenterSchema = new Schema<IMedicalCenter>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String, required: false, trim: true },
    contactInfo: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

const MedicalCenter = model<IMedicalCenter>(
  "MedicalCenter",
  MedicalCenterSchema
);

export default MedicalCenter;
