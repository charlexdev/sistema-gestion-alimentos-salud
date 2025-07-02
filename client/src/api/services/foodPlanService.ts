// client/src/api/services/foodPlanService.ts

import api from "@/lib/axios";
import type { IFoodPlan } from "@/types/foodPlan";
import type {
  FoodPlanFormValues,
  FoodPlanQueryParams,
  FoodPlanListResponse,
} from "@/types/foodPlan";

const FoodPlanService = {
  /**
   * Obtiene una lista paginada de planes de alimentos.
   * @param params Parámetros de consulta para paginación, búsqueda, filtrado por centro médico, etc.
   * @returns Promesa que resuelve con la respuesta paginada de planes de alimentos.
   */
  getFoodPlans: async (
    params: FoodPlanQueryParams
  ): Promise<FoodPlanListResponse> => {
    // La baseURL en axios.ts ya es 'http://localhost:5000/api',
    // por lo tanto, aquí solo necesitamos la parte '/foodplans' (plural, sin guion)
    const response = await api.get("/foodplans", { params }); // <-- ¡CORREGIDO!
    return response.data;
  },

  /**
   * Obtiene un plan de alimentos por su ID.
   * @param id El ID del plan de alimentos.
   * @returns Promesa que resuelve con el objeto del plan de alimentos.
   */
  getFoodPlanById: async (id: string): Promise<IFoodPlan> => {
    const response = await api.get(`/foodplans/${id}`); // <-- ¡CORREGIDO!
    return response.data;
  },

  /**
   * Crea un nuevo plan de alimentos.
   * @param foodPlanData Los datos del nuevo plan de alimentos.
   * @returns Promesa que resuelve con el objeto del plan de alimentos creado.
   */
  createFoodPlan: async (
    foodPlanData: FoodPlanFormValues
  ): Promise<IFoodPlan> => {
    const response = await api.post("/foodplans", foodPlanData); // <-- ¡CORREGIDO!
    return response.data;
  },

  /**
   * Actualiza un plan de alimentos por su ID.
   * @param id El ID del plan de alimentos a actualizar.
   * @param foodPlanData Los datos actualizados del plan de alimentos.
   * @returns Promesa que resuelve con el objeto del plan de alimentos actualizado.
   */
  updateFoodPlan: async (
    id: string,
    foodPlanData: FoodPlanFormValues
  ): Promise<IFoodPlan> => {
    const response = await api.put(`/foodplans/${id}`, foodPlanData); // <-- ¡CORREGIDO!
    return response.data;
  },

  /**
   * Elimina un plan de alimentos por su ID.
   * @param id El ID del plan de alimentos a eliminar.
   * @returns Promesa que resuelve cuando el plan de alimentos ha sido eliminado.
   */
  deleteFoodPlan: async (id: string): Promise<void> => {
    await api.delete(`/foodplans/${id}`); // <-- ¡CORREGIDO!
  },

  /**
   * Exporta planes de alimentos a un archivo Excel.
   * @param params Parámetros de consulta para filtrar los datos a exportar.
   * @returns Promesa que resuelve con un Blob que contiene el archivo Excel.
   */
  exportFoodPlansToExcel: async (
    params: FoodPlanQueryParams
  ): Promise<Blob> => {
    const response = await api.get("/foodplans/export/excel", {
      // <-- ¡CORREGIDO!
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },

  /**
   * Exporta planes de alimentos a un archivo Word.
   * @param params Parámetros de consulta para filtrar los datos a exportar.
   * @returns Promesa que resuelve con un Blob que contiene el archivo Word.
   */
  exportFoodPlansToWord: async (params: FoodPlanQueryParams): Promise<Blob> => {
    const response = await api.get("/foodplans/export/word", {
      // <-- ¡CORREGIDO!
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },
};

export default FoodPlanService;
