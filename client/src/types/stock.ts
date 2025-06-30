// client/src/types/stock.ts

import type { IMedicalCenter } from "./medicalCenter";
import type { IFood } from "./food";

export interface IStock {
  _id: string;
  medicalCenter: string | IMedicalCenter; // Puede ser solo el ID o el objeto completo si está populado
  food: string | IFood; // Puede ser solo el ID o el objeto completo si está populado
  quantity: number;
  createdAt: string; // Mongoose añade createdAt y updatedAt por defecto
  updatedAt: string;
}

// Interfaz para los valores del formulario de creación/edición de Stock
// Nota: La creación de Stock generalmente se maneja a través de FoodEntry,
// pero esta interfaz puede ser útil para una posible funcionalidad de ajuste manual.
export interface StockFormValues {
  medicalCenter: string; // Solo el ID para el envío del formulario
  food: string; // Solo el ID para el envío del formulario
  quantity: number;
}

// Interfaz para los parámetros de consulta de la API de Stock
export interface StockQueryParams {
  page?: number;
  limit?: number;
  search?: string; // Para búsqueda general por nombre de alimento o centro médico
  medicalCenterId?: string; // Para filtrar por centro médico
  foodId?: string; // Para filtrar por alimento específico
  minQuantity?: number; // Para filtrar por cantidad mínima en stock
  maxQuantity?: number; // Para filtrar por cantidad máxima en stock
}

// Interfaz para la respuesta de la lista de Stock desde el backend (con paginación)
export interface StockListResponse {
  data: IStock[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}
