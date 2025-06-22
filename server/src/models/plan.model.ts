// server/src/models/plan.model.ts
import { Schema, model, Document, Types } from "mongoose";
import { IFood } from "./food.model";
import { IMedicalCenter } from "./medicalCenter.model";
import { IProvider } from "./provider.model"; // <-- ¡Nuevo! Importar la interfaz de Proveedor

// Definimos los tipos de planes para mayor claridad y validación
export type PlanType = "weekly" | "monthly" | "annual";

// Interfaz para cada item de alimento dentro de un Plan
export interface IPlanFoodItem {
  food: Types.ObjectId | IFood; // Referencia al ID del alimento
  quantity: number; // Cantidad PLANIFICADA
  provider?: Types.ObjectId | IProvider; // <-- ¡Nuevo! Proveedor opcional para el ítem del plan
}

// Interfaz para el Plan de Alimentos
export interface IPlan extends Document {
  name: string; // Nombre del plan (ej. "Plan Mensual Mayo")
  medicalCenter: Types.ObjectId | IMedicalCenter; // Centro médico al que aplica el plan

  startDate: Date; // <-- ¡Nuevo! Fecha de inicio del plan
  endDate: Date; // <-- ¡Nuevo! Fecha de fin del plan
  planType: PlanType; // <-- ¡Nuevo! Tipo de plan: semanal, mensual, anual

  // Si un plan es de un tipo superior (ej. mensual, anual), puede referenciar a sus sub-planes
  // Esto nos permite construir la jerarquía. 'null' si no es un sub-plan.
  // Podríamos tener un array de sub-planes o un solo parent. Para el enfoque de "incluir contenido",
  // es mejor que el plan de nivel superior "sepa" qué sub-planes incluye.
  // Para la jerarquía: un plan mensual "incluye" semanales, un anual "incluye" mensuales.
  // No pondremos una referencia directa aquí para evitar complejidad de "parent/child" en el modelo directamente
  // La lógica de inclusión se manejará en el controlador.

  foodItems: IPlanFoodItem[]; // Array de ítems de alimentos planificados
}

const PlanFoodItemSchema = new Schema<IPlanFoodItem>(
  {
    food: {
      type: Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    provider: {
      // <-- ¡Nuevo! Campo de proveedor en el ítem
      type: Schema.Types.ObjectId,
      ref: "Provider",
      required: true, // Opcional, si un alimento en un plan puede no tener un proveedor asignado aún
    },
  },
  { _id: false } // No crear _id para subdocumentos si no se necesitan individualmente
);

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    medicalCenter: {
      type: Schema.Types.ObjectId,
      ref: "MedicalCenter",
      required: true,
    },
    startDate: { type: Date, required: true }, // <-- Nuevo
    endDate: { type: Date, required: true }, // <-- Nuevo
    planType: {
      // <-- Nuevo
      type: String,
      enum: ["weekly", "monthly", "annual"], // Restringe los valores permitidos
      required: true,
    },
    foodItems: [PlanFoodItemSchema], // Array de subdocumentos
  },
  { timestamps: true }
);

const Plan = model<IPlan>("Plan", PlanSchema);

export default Plan;
