// client/src/services/food.service.ts
import api from "../../lib/axios"; // Asumiendo que tienes una instancia de Axios configurada

import type {
  IFood,
  FoodFormValues,
  FoodQueryParams,
  FoodListResponse,
} from "../../types/food";

class FoodService {
  private API_URL = "/foods"; // Coincide con la ruta definida en app.ts del backend

  async getFoods(params: FoodQueryParams): Promise<FoodListResponse> {
    const response = await api.get<FoodListResponse>(this.API_URL, { params });
    return response.data;
  }

  async getFoodById(id: string): Promise<IFood> {
    const response = await api.get<IFood>(`${this.API_URL}/${id}`);
    return response.data;
  }

  async createFood(data: FoodFormValues): Promise<IFood> {
    const response = await api.post<IFood>(this.API_URL, data);
    return response.data;
  }

  async updateFood(id: string, data: Partial<FoodFormValues>): Promise<IFood> {
    const response = await api.put<IFood>(`${this.API_URL}/${id}`, data);
    return response.data;
  }

  async deleteFood(id: string): Promise<void> {
    await api.delete(`${this.API_URL}/${id}`);
  }

  // Funciones de exportación (si las necesitas, añádelas aquí y en el backend)
  async exportFoodsToExcel(params: FoodQueryParams): Promise<Blob> {
    const response = await api.get(`${this.API_URL}/export/excel`, {
      params,
      responseType: "blob", // Importante para recibir el archivo binario
    });
    return response.data;
  }

  async exportFoodsToWord(params: FoodQueryParams): Promise<Blob> {
    const response = await api.get(`${this.API_URL}/export/word`, {
      params,
      responseType: "blob", // Importante para recibir el archivo binario
    });
    return response.data;
  }
}

const foodService = new FoodService();
export default foodService;
