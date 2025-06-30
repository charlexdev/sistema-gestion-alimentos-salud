// client/src/types/foodEntry.ts

import type { IMedicalCenter } from "./medicalCenter";
import type { IProvider } from "./provider";
import type { IFood } from "./food";
import type { IFoodPlan } from "./foodPlan";

// Interfaz para los detalles de alimentos en una entrada
export interface IEnteredFood {
  food: string | IFood; // Puede ser solo el ID o el objeto completo si está populado
  quantity: number;
}

export interface IFoodEntry {
  _id: string;
  medicalCenter: string | IMedicalCenter; // Puede ser solo el ID o el objeto completo si está populado
  provider: string | IProvider; // Puede ser solo el ID o el objeto completo si está populado
  foodPlan: string | IFoodPlan; // Puede ser solo el ID o el objeto completo si está populado
  entryDate: string; // Se representará como string en el frontend (ISO Date String)
  enteredFoods: IEnteredFood[];
  createdAt: string;
  updatedAt: string;
}

// Interfaz para los valores del formulario de creación/edición de una Entrada de Alimentos
export interface FoodEntryFormValues {
  medicalCenter: string; // Solo el ID para el envío del formulario
  provider: string; // Solo el ID para el envío del formulario
  foodPlan: string; // Solo el ID para el envío del formulario
  entryDate: string; // Formato de fecha para el input (ej. "YYYY-MM-DD")
  enteredFoods: Array<{
    food: string; // Solo el ID del alimento
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
  startDate?: string; // Para filtrar por rango de fechas (ISO Date String)
  endDate?: string; // Para filtrar por rango de fechas (ISO Date String)
}

// Interfaz para la respuesta de la lista de Entradas de Alimentos desde el backend (con paginación)
export interface FoodEntryListResponse {
  data: IFoodEntry[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}
