import { Schema, model, Document, Types } from "mongoose";

export interface IMedicalCenter extends Document {
  name: string;
  address: string;
  email?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalCenterSchema = new Schema<IMedicalCenter>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: false,
      trim: true,
      maxlength: 50,
      // match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Por favor, introduce un correo electrónico válido']
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      maxlength: 8,
      // match: [/^\d{8}$/, 'El número de teléfono fijo debe tener exactamente 8 dígitos.']
    },
  },
  { timestamps: true }
);

// Middleware de validación para asegurar al menos un método de contacto
MedicalCenterSchema.pre("save", function (next) {
  if (!this.email && !this.phoneNumber) {
    const error = new Error(
      "Introduzca al menos un método de contacto (correo o teléfono)."
    );
    return next(error);
  }
  next();
});

const MedicalCenter = model<IMedicalCenter>(
  "MedicalCenter",
  MedicalCenterSchema
);

export default MedicalCenter;
