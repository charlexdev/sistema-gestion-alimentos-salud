// server/src/models/provider.model.ts
import { Schema, model, Document, Types } from "mongoose"; // Importa 'Types'

export interface IProvider extends Document {
  _id: Types.ObjectId; // Añade el tipo explícito para _id
  name: string; // Ej: "Distribuidora La Estrella", "Granja El Sol"
  contactInfo?: string; // Ej: "Tel: 555-1111, Email: contacto@proveedor.com" (opcional)
  address?: string; // Ej: "Calle Falsa 123" (opcional)
  createdAt: Date; // Añade el tipo explícito para createdAt
  updatedAt: Date; // Añade el tipo explícito para updatedAt
}

const ProviderSchema = new Schema<IProvider>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    contactInfo: { type: String, required: false, trim: true },
    address: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

const Provider = model<IProvider>("Provider", ProviderSchema);

export default Provider;
