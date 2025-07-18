import { Schema, model, Document, Types } from "mongoose";

export interface IProvider extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  phoneNumber?: string;
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
    address: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

const Provider = model<IProvider>("Provider", ProviderSchema);

export default Provider;
