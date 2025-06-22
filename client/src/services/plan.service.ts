// client/src/services/plan.service.ts
import api from "./api"; // Asumiendo que tienes una instancia de Axios configurada

import type {
  IPlan,
  PlanFormValues,
  PlanQueryParams,
  PlanListResponse,
} from "../types/plan";

class PlanService {
  private API_URL = "/plans"; // Coincide con la ruta base definida en plan.routes.ts del backend

  /**
   * Obtiene una lista de planes, con opciones de paginación, búsqueda y filtros.
   * También soporta la agregación de planes inferiores (semanales, mensuales).
   * @param params Objeto con los parámetros de consulta (page, limit, search, medicalCenterId, planType, startDate, endDate, aggregateBy).
   * @returns Una promesa que resuelve con un objeto PlanListResponse.
   */
  async getPlans(params: PlanQueryParams): Promise<PlanListResponse> {
    const response = await api.get<PlanListResponse>(this.API_URL, { params });
    return response.data;
  }

  /**
   * Obtiene un plan específico por su ID.
   * @param id El ID del plan.
   * @returns Una promesa que resuelve con el objeto IPlan.
   */
  async getPlanById(id: string): Promise<IPlan> {
    const response = await api.get<IPlan>(`${this.API_URL}/${id}`);
    return response.data;
  }

  /**
   * Crea un nuevo plan.
   * @param data Los valores del formulario para el nuevo plan.
   * @returns Una promesa que resuelve con el objeto IPlan del plan creado.
   */
  async createPlan(data: PlanFormValues): Promise<IPlan> {
    // Asegurarse de que startDate y endDate se envíen como ISO strings si el formulario los da en otro formato (ej. YYYY-MM-DD)
    const payload = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    };
    const response = await api.post<IPlan>(this.API_URL, payload);
    return response.data;
  }

  /**
   * Actualiza un plan existente por su ID.
   * @param id El ID del plan a actualizar.
   * @param data Los valores parciales del formulario para el plan.
   * @returns Una promesa que resuelve con el objeto IPlan del plan actualizado.
   */
  async updatePlan(id: string, data: Partial<PlanFormValues>): Promise<IPlan> {
    const payload: Partial<
      PlanFormValues & { startDate?: string; endDate?: string }
    > = { ...data };

    if (data.startDate) {
      payload.startDate = new Date(data.startDate).toISOString();
    }
    if (data.endDate) {
      payload.endDate = new Date(data.endDate).toISOString();
    }

    const response = await api.put<IPlan>(`${this.API_URL}/${id}`, payload);
    return response.data;
  }

  /**
   * Elimina un plan por su ID.
   * @param id El ID del plan a eliminar.
   * @returns Una promesa que resuelve cuando el plan es eliminado.
   */
  async deletePlan(id: string): Promise<void> {
    await api.delete(`${this.API_URL}/${id}`);
  }

  // === Funciones de Exportación (necesitarían rutas en el backend si las usas) ===
  /**
   * Exporta planes a un archivo Excel.
   * @param params Parámetros de consulta para filtrar los planes a exportar.
   * @returns Una promesa que resuelve con un Blob que contiene el archivo Excel.
   */
  async exportPlansToExcel(params: PlanQueryParams): Promise<Blob> {
    const response = await api.get(`${this.API_URL}/export/excel`, {
      params,
      responseType: "blob", // Importante para recibir el archivo binario
    });
    return response.data;
  }

  /**
   * Exporta planes a un archivo Word.
   * @param params Parámetros de consulta para filtrar los planes a exportar.
   * @returns Una promesa que resuelve con un Blob que contiene el archivo Word.
   */
  async exportPlansToWord(params: PlanQueryParams): Promise<Blob> {
    const response = await api.get(`${this.API_URL}/export/word`, {
      params,
      responseType: "blob", // Importante para recibir el archivo binario
    });
    return response.data;
  }
}

const planService = new PlanService();
export default planService;
