import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: "admin" | "user"; // Roles para permisos
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  { timestamps: true }
);

export default model<IUser>("User", userSchema);
