import { Schema, model, Document, Types } from "mongoose";
import { IMedicalCenter } from "./medicalCenter.model";
import { IProvider } from "./provider.model";
import { IFood } from "./food.model";

export interface IPlannedFood {
  food: Types.ObjectId | IFood;
  provider: Types.ObjectId | IProvider;
  quantity: number;
}

export interface IFoodPlan extends Document {
  name: string;
  medicalCenter: Types.ObjectId | IMedicalCenter;
  type: "weekly" | "monthly" | "annual";
  startDate: Date;
  endDate: Date;
  plannedFoods: IPlannedFood[];
  status: "active" | "concluded";
  weeklyPlans?: Types.ObjectId[] | IFoodPlan[];
  monthlyPlans?: Types.ObjectId[] | IFoodPlan[];
  createdAt: Date;
  updatedAt: Date;
}

const PlannedFoodSchema = new Schema<IPlannedFood>(
  {
    food: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    provider: { type: Schema.Types.ObjectId, ref: "Provider", required: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
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
    plannedFoods: { type: [PlannedFoodSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "concluded"],
      default: "active",
      required: true,
    },
    weeklyPlans: [{ type: Schema.Types.ObjectId, ref: "FoodPlan" }],
    monthlyPlans: [{ type: Schema.Types.ObjectId, ref: "FoodPlan" }],
  },
  { timestamps: true }
);

FoodPlanSchema.pre("save", function (next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    next(new Error("La fecha de fin debe ser posterior a la fecha de inicio."));
  } else {
    next();
  }
});

const FoodPlan = model<IFoodPlan>("FoodPlan", FoodPlanSchema);

export default FoodPlan;
