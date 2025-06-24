// client/src/services/unitOfMeasurement.service.ts
import api from "../../lib/axios"; // Asegúrate de que tu instancia de Axios configurada globalmente
import type {
  IUnitOfMeasurement,
  UnitOfMeasurementFormValues,
  UnitOfMeasurementQueryParams,
  UnitOfMeasurementListResponse,
} from "../../types/unitOfMeasurement";

class UnitOfMeasurementService {
  private API_URL = "/units";

  async getUnitsOfMeasurement(
    params: UnitOfMeasurementQueryParams
  ): Promise<UnitOfMeasurementListResponse> {
    const response = await api.get<UnitOfMeasurementListResponse>(
      this.API_URL,
      {
        params,
      }
    );
    return response.data;
  }

  async getUnitOfMeasurementById(id: string): Promise<IUnitOfMeasurement> {
    const response = await api.get<IUnitOfMeasurement>(`${this.API_URL}/${id}`);
    return response.data;
  }

  async createUnitOfMeasurement(
    data: UnitOfMeasurementFormValues
  ): Promise<IUnitOfMeasurement> {
    const response = await api.post<IUnitOfMeasurement>(this.API_URL, data);
    return response.data;
  }

  async updateUnitOfMeasurement(
    id: string,
    data: Partial<UnitOfMeasurementFormValues>
  ): Promise<IUnitOfMeasurement> {
    const response = await api.put<IUnitOfMeasurement>(
      `${this.API_URL}/${id}`,
      data
    );
    return response.data;
  }

  async deleteUnitOfMeasurement(id: string): Promise<void> {
    await api.delete(`${this.API_URL}/${id}`);
  }

  // FUNCIONES DE EXPORTACIÓN (AHORA DESCOMENTADAS)
  async exportUnitsToExcel(
    params: UnitOfMeasurementQueryParams
  ): Promise<Blob> {
    const response = await api.get(`${this.API_URL}/export/excel`, {
      params,
      responseType: "blob", // Importante para recibir el archivo binario
    });
    return response.data;
  }

  async exportUnitsToWord(params: UnitOfMeasurementQueryParams): Promise<Blob> {
    const response = await api.get(`${this.API_URL}/export/word`, {
      params,
      responseType: "blob", // Importante para recibir el archivo binario
    });
    return response.data;
  }
}

export default new UnitOfMeasurementService();
