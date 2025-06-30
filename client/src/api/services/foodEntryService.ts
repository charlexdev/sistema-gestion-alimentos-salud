// client/src/api/services/foodEntryService.ts

import api from "@/lib/axios"; // Asume que 'api' es tu instancia de Axios configurada
import type { IFoodEntry } from "@/types/foodEntry"; // Importamos la interfaz del tipo de frontend
import type {
  FoodEntryFormValues,
  FoodEntryQueryParams,
  FoodEntryListResponse,
} from "@/types/foodEntry"; // Importamos las interfaces específicas para el servicio

const FoodEntryService = {
  /**
   * Obtiene una lista paginada de entradas de alimentos.
   * @param params Parámetros de consulta para paginación, búsqueda, filtrado por centro médico, proveedor, plan de alimentos o fecha.
   * @returns Promesa que resuelve con la respuesta paginada de entradas de alimentos.
   */
  getFoodEntries: async (
    params: FoodEntryQueryParams
  ): Promise<FoodEntryListResponse> => {
    const response = await api.get("/food-entries", { params });
    return response.data;
  },

  /**
   * Obtiene una entrada de alimentos por su ID.
   * @param id El ID de la entrada de alimentos.
   * @returns Promesa que resuelve con el objeto de la entrada de alimentos.
   */
  getFoodEntryById: async (id: string): Promise<IFoodEntry> => {
    const response = await api.get(`/food-entries/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva entrada de alimentos.
   * @param foodEntryData Los datos de la entrada de alimentos a crear.
   * @returns Promesa que resuelve con el objeto de la entrada de alimentos creada.
   */
  createFoodEntry: async (
    foodEntryData: FoodEntryFormValues
  ): Promise<IFoodEntry> => {
    const response = await api.post("/food-entries", foodEntryData);
    return response.data;
  },

  /**
   * Actualiza una entrada de alimentos existente por su ID.
   * @param id El ID de la entrada de alimentos a actualizar.
   * @param foodEntryData Los datos actualizados de la entrada de alimentos.
   * @returns Promesa que resuelve con el objeto de la entrada de alimentos actualizada.
   */
  updateFoodEntry: async (
    id: string,
    foodEntryData: FoodEntryFormValues
  ): Promise<IFoodEntry> => {
    const response = await api.put(`/food-entries/${id}`, foodEntryData);
    return response.data;
  },

  /**
   * Elimina una entrada de alimentos por su ID.
   * @param id El ID de la entrada de alimentos a eliminar.
   * @returns Promesa que resuelve cuando la entrada de alimentos ha sido eliminada.
   */
  deleteFoodEntry: async (id: string): Promise<void> => {
    await api.delete(`/food-entries/${id}`);
  },

  /**
   * Exporta entradas de alimentos a un archivo Excel.
   * @param params Parámetros de consulta para filtrar los datos a exportar.
   * @returns Promesa que resuelve con un Blob que contiene el archivo Excel.
   */
  exportFoodEntriesToExcel: async (
    params: FoodEntryQueryParams
  ): Promise<Blob> => {
    const response = await api.get("/food-entries/export/excel", {
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },

  /**
   * Exporta entradas de alimentos a un archivo Word.
   * @param params Parámetros de consulta para filtrar los datos a exportar.
   * @returns Promesa que resuelve con un Blob que contiene el archivo Word.
   */
  exportFoodEntriesToWord: async (
    params: FoodEntryQueryParams
  ): Promise<Blob> => {
    const response = await api.get("/food-entries/export/word", {
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },
};

export default FoodEntryService;
