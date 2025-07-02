// client/src/api/services/foodEntryService.ts

import api from "@/lib/axios";
import type {
  IFoodEntry,
  FoodEntryFormValues,
  FoodEntryQueryParams,
  FoodEntryListResponse,
} from "@/types/foodEntry";

const FoodEntryService = {
  /**
   * Obtiene una lista paginada de entradas de alimentos.
   * @param params Parámetros de consulta para paginación, búsqueda, filtrado por centro médico, proveedor, plan de alimentos o fecha.
   * @returns Promesa que resuelve con la respuesta paginada de entradas de alimentos.
   */
  getFoodEntries: async (
    params: FoodEntryQueryParams
  ): Promise<FoodEntryListResponse> => {
    // La baseURL en axios.ts ya es 'http://localhost:5000/api',
    // por lo tanto, aquí solo necesitamos la parte '/foodentries' (plural, sin guion)
    const response = await api.get("/foodentries", { params }); // <-- ¡CORREGIDO!
    return response.data;
  },

  /**
   * Obtiene una entrada de alimentos por su ID.
   * @param id El ID de la entrada de alimentos.
   * @returns Promesa que resuelve con el objeto de la entrada de alimentos.
   */
  getFoodEntryById: async (id: string): Promise<IFoodEntry> => {
    const response = await api.get(`/foodentries/${id}`); // <-- ¡CORREGIDO!
    return response.data;
  },

  /**
   * Crea una nueva entrada de alimentos.
   * @param foodEntryData Los datos de la nueva entrada de alimentos.
   * @returns Promesa que resuelve con el objeto de la entrada de alimentos creada.
   */
  createFoodEntry: async (
    foodEntryData: FoodEntryFormValues
  ): Promise<IFoodEntry> => {
    const response = await api.post("/foodentries", foodEntryData); // <-- ¡CORREGIDO!
    return response.data;
  },

  /**
   * Actualiza una entrada de alimentos por su ID.
   * @param id El ID de la entrada de alimentos a actualizar.
   * @param foodEntryData Los datos actualizados de la entrada de alimentos.
   * @returns Promesa que resuelve con el objeto de la entrada de alimentos actualizada.
   */
  updateFoodEntry: async (
    id: string,
    foodEntryData: FoodEntryFormValues
  ): Promise<IFoodEntry> => {
    const response = await api.put(`/foodentries/${id}`, foodEntryData); // <-- ¡CORREGIDO!
    return response.data;
  },

  /**
   * Elimina una entrada de alimentos por su ID.
   * @param id El ID de la entrada de alimentos a eliminar.
   * @returns Promesa que resuelve cuando la entrada de alimentos ha sido eliminada.
   */
  deleteFoodEntry: async (id: string): Promise<void> => {
    await api.delete(`/foodentries/${id}`); // <-- ¡CORREGIDO!
  },

  /**
   * Exporta entradas de alimentos a un archivo Excel.
   * @param params Parámetros de consulta para filtrar los datos a exportar.
   * @returns Promesa que resuelve con un Blob que contiene el archivo Excel.
   */
  exportFoodEntriesToExcel: async (
    params: FoodEntryQueryParams
  ): Promise<Blob> => {
    const response = await api.get("/foodentries/export/excel", {
      // <-- ¡CORREGIDO!
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
    const response = await api.get("/foodentries/export/word", {
      // <-- ¡CORREGIDO!
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },
};

export default FoodEntryService;
