// server/src/models/provider.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IProvider extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string; // Nuevo campo para el correo electrónico
  phoneNumber?: string; // Nuevo campo para el número de teléfono fijo
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderSchema = new Schema<IProvider>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: false,
      trim: true,
      maxlength: 50, // Validar longitud máxima en el backend
      // Puedes añadir una validación de formato regex si es necesario
      // match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Por favor, introduce un correo electrónico válido']
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      maxlength: 8, // Validar longitud máxima en el backend
      // Puedes añadir una validación de formato regex para 8 dígitos si es necesario
      // match: [/^\d{8}$/, 'El número de teléfono fijo debe tener exactamente 8 dígitos.']
    },
    address: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

const Provider = model<IProvider>("Provider", ProviderSchema);

export default Provider;
