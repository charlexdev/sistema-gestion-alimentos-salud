// client/src/types/foodPlan.ts

import type { IMedicalCenter } from "./medicalCenter";
import type { IProvider } from "./provider";
import type { IFood } from "./food";

// Interfaz para los detalles de alimentos dentro de un plan
export interface IPlannedFood {
  food: string | IFood; // Puede ser solo el ID o el objeto completo si está populado
  provider: string | IProvider; // Puede ser solo el ID o el objeto completo si está populado
  quantity: number;
}

export interface IFoodPlan {
  _id: string;
  name: string;
  medicalCenter: string | IMedicalCenter; // Puede ser solo el ID o el objeto completo si está populado
  type: "weekly" | "monthly" | "annual";
  startDate: string; // Se representará como string en el frontend (ISO Date String)
  endDate: string; // Se representará como string en el frontend (ISO Date String)
  plannedFoods: IPlannedFood[];
  status: "active" | "concluded";
  weeklyPlans?: string[] | IFoodPlan[]; // IDs o planes populados
  monthlyPlans?: string[] | IFoodPlan[]; // IDs o planes populados
  createdAt: string;
  updatedAt: string;
  // Nuevas propiedades para el reporte, son opcionales porque se calculan dinámicamente
  totalPlannedQuantity?: number;
  realQuantity?: number;
  percentageCompleted?: number;
}

// Interfaz para los valores del formulario de creación/edición de un Plan de Alimentos
export interface FoodPlanFormValues {
  name: string;
  medicalCenter: string; // Solo el ID para el envío del formulario
  type: "weekly" | "monthly" | "annual";
  startDate: string; // Formato de fecha para el input (ej. "YYYY-MM-DD")
  endDate: string; // Formato de fecha para el input (ej. "YYYY-MM-DD")
  plannedFoods: Array<{
    food: string; // Solo el ID del alimento
    provider: string; // Solo el ID del proveedor
    quantity: number;
  }>;
  status: "active" | "concluded";
  weeklyPlans?: string[]; // Solo IDs para el envío del formulario
  monthlyPlans?: string[]; // Solo IDs para el envío del formulario
}

// Interfaz para los parámetros de consulta de la API de Planes de Alimentos
export interface FoodPlanQueryParams {
  page?: number;
  limit?: number;
  search?: string; // Para búsqueda general
  medicalCenterId?: string; // Para filtrar por centro médico
  type?: "weekly" | "monthly" | "annual"; // Para filtrar por tipo de plan
  status?: "active" | "concluded"; // Para filtrar por estado
  startDate?: string; // Para filtrar por rango de fechas (ISO Date String)
  endDate?: string; // Para filtrar por rango de fechas (ISO Date String)
}

// Interfaz para la respuesta de la lista de Planes de Alimentos desde el backend (con paginación)
export interface FoodPlanListResponse {
  data: IFoodPlan[]; // La lista de planes
  totalItems: number; // El número total de elementos
  totalPages: number; // El número total de páginas
  currentPage: number; // La página actual
  itemsPerPage: number; // Número de elementos por página
}
