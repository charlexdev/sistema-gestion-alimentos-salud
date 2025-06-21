// client/src/services/medicalCenter.service.ts
import api from "./api"; // ¡IMPORTA LA INSTANCIA DE AXIOS CONFIGURADA!
import type {
  IMedicalCenter,
  MedicalCenterFormValues,
  MedicalCenterQueryParams,
  MedicalCenterListResponse,
} from "../types/medicalCenter";

// Ya no necesitas API_BASE_URL ni BASE_URL aquí, ya que 'api.ts' lo gestiona
// y las rutas aquí son relativas a la baseURL configurada en 'api.ts'.

class MedicalCenterService {
  private API_URL = "/medical-centers"; // Ruta base para centros médicos, relativa a la baseURL de 'api.ts'

  async getMedicalCenters(
    params: MedicalCenterQueryParams
  ): Promise<MedicalCenterListResponse> {
    // Usa 'api.get' y el interceptor se encargará del token
    const response = await api.get<MedicalCenterListResponse>(this.API_URL, {
      params,
    });
    return response.data;
  }

  async getMedicalCenterById(id: string): Promise<IMedicalCenter> {
    const response = await api.get<IMedicalCenter>(`${this.API_URL}/${id}`);
    return response.data;
  }

  async createMedicalCenter(
    data: MedicalCenterFormValues
  ): Promise<IMedicalCenter> {
    const response = await api.post<IMedicalCenter>(this.API_URL, data);
    return response.data;
  }

  async updateMedicalCenter(
    id: string,
    data: Partial<MedicalCenterFormValues>
  ): Promise<IMedicalCenter> {
    const response = await api.put<IMedicalCenter>(
      `${this.API_URL}/${id}`,
      data
    );
    return response.data;
  }

  async deleteMedicalCenter(id: string): Promise<void> {
    await api.delete(`${this.API_URL}/${id}`);
  }

  async exportMedicalCentersToExcel(
    params: MedicalCenterQueryParams
  ): Promise<Blob> {
    const response = await api.get(`${this.API_URL}/export/excel`, {
      params,
      responseType: "blob", // Importante para manejar archivos binarios
    });
    return response.data;
  }

  async exportMedicalCentersToWord(
    params: MedicalCenterQueryParams
  ): Promise<Blob> {
    const response = await api.get(`${this.API_URL}/export/word`, {
      params,
      responseType: "blob", // Importante para manejar archivos binarios
    });
    return response.data;
  }
}

export default new MedicalCenterService();
