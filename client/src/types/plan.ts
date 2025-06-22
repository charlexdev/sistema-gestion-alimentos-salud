// client/src/types/plan.ts

import type { IFood } from "./food"; // Asegúrate de importar IFood
import type { IMedicalCenter } from "./medicalCenter"; // Asegúrate de importar IMedicalCenter
import type { IProvider } from "./provider"; // <-- ¡NUEVO! Importa IProvider

// Tipos de plan que coinciden con el enum del backend
export type PlanType = "weekly" | "monthly" | "annual";

// Interfaz para cada ítem de alimento dentro de un plan
export interface IPlanFoodItem {
  food: string | IFood; // Puede ser el ObjectId como string, o el objeto populado
  quantity: number;
  provider: string | IProvider; // <-- ¡NUEVO! Puede ser ObjectId o el objeto populado
}

// Interfaz para la estructura del Plan tal como viene del backend
export interface IPlan {
  _id: string;
  name: string;
  startDate: string; // Se representa como string al venir de la API (ISO date string)
  endDate: string; // Se representa como string al venir de la API (ISO date string)
  medicalCenter: string | IMedicalCenter; // Puede ser ObjectId o el objeto populado
  planType: PlanType; // Tipo de plan: 'weekly', 'monthly', 'annual'
  foodItems: IPlanFoodItem[];
  createdAt: string;
  updatedAt: string;
}

// Interfaz para los valores del formulario de creación/edición de un Plan
export interface PlanFormValues {
  name: string;
  startDate: string; // Formato 'YYYY-MM-DD' para el input de fecha
  endDate: string; // Formato 'YYYY-MM-DD' para el input de fecha
  medicalCenterId: string; // Solo el ID para el envío al backend
  planType: PlanType;
  foodItems: {
    foodId: string;
    quantity: number;
    providerId: string; // <-- ¡NUEVO! ID del proveedor
  }[];
}

// Interfaz para los parámetros de consulta al obtener planes (paginación, búsqueda, filtros)
export interface PlanQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  medicalCenterId?: string; // Para filtrar por centro médico
  planType?: PlanType; // Para filtrar por tipo de plan
  startDate?: string; // Rango de fecha de inicio para la consulta (ISO string)
  endDate?: string; // Rango de fecha de fin para la consulta (ISO string)
  aggregateBy?: "monthly" | "annual"; // Para solicitar planes agregados
}

// Interfaz para la respuesta de la lista de planes desde el backend (con paginación)
export interface PlanListResponse {
  plans: IPlan[]; // La lista de planes (podría ser un solo plan agregado)
  totalCount: number; // Número total de planes (o 1 si es un plan agregado)
  currentPage: number;
  totalPages: number;
}
