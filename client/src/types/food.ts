// client/src/types/food.d.ts o food.ts
import type { IUnitOfMeasurement } from "./unitOfMeasurement"; // Asegúrate de importar esto

export interface IFood {
  _id: string;
  name: string;
  // unitOfMeasurement puede ser el ObjectId como string, o el objeto populado
  unitOfMeasurement: string | IUnitOfMeasurement;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodFormValues {
  name: string;
  unitOfMeasurementId: string; // <-- Aquí definimos unitOfMeasurementId para el formulario
  description?: string;
}

export interface FoodQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  // Si deseas filtrar por el ID de la unidad de medida, inclúyelo aquí
  unitOfMeasurementId?: string; // <-- Agrega esta propiedad para los query params
}

export interface FoodListResponse {
  foods: IFood[];
  totalCount: number; // El número total de elementos
  totalPages: number; // El número total de páginas (comúnmente usado para paginación)
  currentPage: number;
}
