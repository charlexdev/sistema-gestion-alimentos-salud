// server/src/models/foodPlan.model.ts
import { Schema, model, Document, Types } from "mongoose";
import { IMedicalCenter } from "./medicalCenter.model";
import { IProvider } from "./provider.model";
import { IFood } from "./food.model";

// Interfaz para los detalles de alimentos dentro de un plan
export interface IPlannedFood {
  food: Types.ObjectId | IFood;
  provider: Types.ObjectId | IProvider; // El proveedor específico para este alimento en este plan
  quantity: number;
}

export interface IFoodPlan extends Document {
  name: string; // Nombre descriptivo del plan (ej. "Plan Semanal Enero 1-7 Hospital Central")
  medicalCenter: Types.ObjectId | IMedicalCenter;
  type: "weekly" | "monthly" | "annual"; // Tipo de plan
  startDate: Date;
  endDate: Date;
  plannedFoods: IPlannedFood[]; // Array de alimentos planificados
  status: "active" | "concluded"; // Estado del plan
  // Relaciones jerárquicas para planes mensuales/anuales
  // Un plan mensual/anual puede contener referencias a planes de menor granularidad
  // Estos campos serán opcionales y solo se usarán si el plan es monthly o annual
  weeklyPlans?: Types.ObjectId[] | IFoodPlan[]; // Para planes mensuales o anuales
  monthlyPlans?: Types.ObjectId[] | IFoodPlan[]; // Para planes anuales
  createdAt: Date;
  updatedAt: Date;
}

const PlannedFoodSchema = new Schema<IPlannedFood>(
  {
    food: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    provider: { type: Schema.Types.ObjectId, ref: "Provider", required: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false } // No crear un _id para subdocumentos si no es estrictamente necesario
);

const FoodPlanSchema = new Schema<IFoodPlan>(
  {
    name: { type: String, required: true, trim: true },
    medicalCenter: {
      type: Schema.Types.ObjectId,
      ref: "MedicalCenter",
      required: true,
    },
    type: {
      type: String,
      enum: ["weekly", "monthly", "annual"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    plannedFoods: { type: [PlannedFoodSchema], default: [] }, // Array de subdocumentos
    status: {
      type: String,
      enum: ["active", "concluded"],
      default: "active",
      required: true,
    },
    weeklyPlans: [{ type: Schema.Types.ObjectId, ref: "FoodPlan" }], // Referencia a otros planes de tipo 'weekly'
    monthlyPlans: [{ type: Schema.Types.ObjectId, ref: "FoodPlan" }], // Referencia a otros planes de tipo 'monthly'
  },
  { timestamps: true }
);

// Middleware para validar que endDate sea posterior a startDate
FoodPlanSchema.pre("save", function (next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    next(new Error("La fecha de fin debe ser posterior a la fecha de inicio."));
  } else {
    next();
  }
});

const FoodPlan = model<IFoodPlan>("FoodPlan", FoodPlanSchema);

export default FoodPlan;
