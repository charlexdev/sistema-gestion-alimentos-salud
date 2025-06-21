// client/src/types/food.ts

import type { IUnitOfMeasurement } from "./unitOfMeasurement";

export interface IFood {
  _id: string;
  name: string;
  unitOfMeasurement: string | IUnitOfMeasurement;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Si tu backend también devuelve estos campos para alimentos existentes, añádelos aquí.
  // Pero por el momento, en la respuesta que me has dado no aparecen asociados a cada alimento.
  // Asegúrate de que tu modelo de alimentos en el backend los tenga y los devuelva si son relevantes.
  // caloriesPerUnit?: number;
  // proteinPerUnit?: number;
  // carbsPerUnit?: number;
  // fatPerUnit?: number;
}

export interface FoodFormValues {
  name: string;
  unitOfMeasurementId: string;
  description?: string;
}

export interface FoodQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  unitOfMeasurementId?: string;
}

// *** CAMBIO AQUÍ para que coincida con la respuesta de tu backend ***
export interface FoodListResponse {
  data: IFood[]; // <--- Cambiado de 'foods' a 'data'
  totalItems: number; // <--- Cambiado de 'totalCount' a 'totalItems'
  totalPages: number;
  currentPage: number;
  itemsPerPage: number; // <--- Añadido, ya que tu backend lo devuelve
}
