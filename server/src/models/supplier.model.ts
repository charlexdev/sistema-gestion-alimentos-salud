import { Schema, model, Document } from "mongoose";

export interface ISupplier extends Document {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, unique: true },
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },
  },
  { timestamps: true }
);

export default model<ISupplier>("Supplier", supplierSchema);
