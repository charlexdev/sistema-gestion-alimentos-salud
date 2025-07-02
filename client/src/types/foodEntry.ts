// client/src/types/foodEntry.ts
import type { IMedicalCenter } from "./medicalCenter";
import type { IProvider } from "./provider";
import type { IFood } from "./food";
import type { IFoodPlan } from "./foodPlan";

export interface IEnteredFood {
  food: string | IFood;
  quantity: number;
}

export interface IFoodEntry {
  _id: string;
  medicalCenter: string | IMedicalCenter;
  provider: string | IProvider;
  foodPlan: string | IFoodPlan;
  entryDate: string;
  enteredFoods: IEnteredFood[];
  createdAt: string;
  updatedAt: string;
}

export interface FoodEntryFormValues {
  medicalCenter: string;
  provider: string;
  foodPlan: string;
  entryDate: string;
  enteredFoods: Array<{
    food: string;
    quantity: number;
  }>;
}

// Interfaz para los parámetros de consulta de la API de Entradas de Alimentos
export interface FoodEntryQueryParams {
  page?: number;
  limit?: number;
  search?: string; // Para búsqueda general
  medicalCenterId?: string; // Para filtrar por centro médico
  providerId?: string; // Para filtrar por proveedor
  foodPlanId?: string; // Para filtrar por plan de alimentos
  foodId?: string; // <--- ¡AÑADIR ESTA LÍNEA!
  startDate?: string; // Para filtrar por rango de fechas (ISO Date String)
  endDate?: string; // Para filtrar por rango de fechas (ISO Date String)
}

export interface FoodEntryListResponse {
  data: IFoodEntry[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}
