// client/src/services/provider.service.ts
import api from "./api"; // Importa la instancia global de Axios configurada
import type {
  IProvider,
  ProviderFormValues,
  ProviderQueryParams,
  ProviderListResponse,
} from "../types/provider";

// Ya no necesitas API_BASE_URL ni BASE_URL definidos localmente aquí
// El baseURL ya está configurado en api.ts
// const API_BASE_URL = "http://localhost:5000/api";
// const BASE_URL = `${API_BASE_URL}/providers`;

class ProviderService {
  // Define la ruta base relativa a la baseURL configurada en api.ts
  private API_PATH = "/providers";

  async getProviders(
    params: ProviderQueryParams
  ): Promise<ProviderListResponse> {
    // Usa la instancia 'api' directamente. El interceptor se encarga de añadir los headers.
    const response = await api.get<ProviderListResponse>(this.API_PATH, {
      params,
    });
    return response.data;
  }

  async getProviderById(id: string): Promise<IProvider> {
    const response = await api.get<IProvider>(`${this.API_PATH}/${id}`);
    return response.data;
  }

  async createProvider(data: ProviderFormValues): Promise<IProvider> {
    const response = await api.post<IProvider>(this.API_PATH, data);
    return response.data;
  }

  async updateProvider(
    id: string,
    data: Partial<ProviderFormValues>
  ): Promise<IProvider> {
    const response = await api.put<IProvider>(`${this.API_PATH}/${id}`, data);
    return response.data;
  }

  async deleteProvider(id: string): Promise<void> {
    await api.delete(`${this.API_PATH}/${id}`);
  }

  // === Funciones de Exportación ===
  // Asegúrate de que las rutas en tu backend para exportar coincidan con estas.
  async exportProvidersToExcel(params: ProviderQueryParams): Promise<Blob> {
    const response = await api.get(`${this.API_PATH}/export/excel`, {
      params,
      responseType: "blob", // Importante para recibir el archivo binario
    });
    return response.data;
  }

  async exportProvidersToWord(params: ProviderQueryParams): Promise<Blob> {
    const response = await api.get(`${this.API_PATH}/export/word`, {
      params,
      responseType: "blob",
    });
    return response.data;
  }
}

const providerService = new ProviderService(); // Exporta una instancia
export default providerService;
