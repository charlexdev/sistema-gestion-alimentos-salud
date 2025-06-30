// client/src/services/medicalCenterService.ts

import api from "@/lib/axios"; // Asume que 'api' es tu instancia de Axios configurada
import type { IMedicalCenter } from "@/types/medicalCenter"; // Importamos la interfaz del tipo de frontend
import type {
  MedicalCenterFormValues,
  MedicalCenterQueryParams,
  MedicalCenterListResponse,
} from "@/types/medicalCenter"; // Importamos las interfaces específicas para el servicio

const MedicalCenterService = {
  /**
   * Obtiene una lista paginada de centros médicos.
   * @param params Parámetros de consulta para paginación, búsqueda, etc.
   * @returns Promesa que resuelve con la respuesta paginada de centros médicos.
   */
  getMedicalCenters: async (
    params: MedicalCenterQueryParams
  ): Promise<MedicalCenterListResponse> => {
    const response = await api.get("/medical-centers", { params });
    return response.data;
  },

  /**
   * Obtiene un centro médico por su ID.
   * @param id El ID del centro médico.
   * @returns Promesa que resuelve con el objeto del centro médico.
   */
  getMedicalCenterById: async (id: string): Promise<IMedicalCenter> => {
    const response = await api.get(`/medical-centers/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo centro médico.
   * @param medicalCenterData Los datos del centro médico a crear.
   * @returns Promesa que resuelve con el objeto del centro médico creado.
   */
  createMedicalCenter: async (
    medicalCenterData: MedicalCenterFormValues
  ): Promise<IMedicalCenter> => {
    const response = await api.post("/medical-centers", medicalCenterData);
    return response.data;
  },

  /**
   * Actualiza un centro médico existente por su ID.
   * @param id El ID del centro médico a actualizar.
   * @param medicalCenterData Los datos actualizados del centro médico.
   * @returns Promesa que resuelve con el objeto del centro médico actualizado.
   */
  updateMedicalCenter: async (
    id: string,
    medicalCenterData: MedicalCenterFormValues
  ): Promise<IMedicalCenter> => {
    const response = await api.put(`/medical-centers/${id}`, medicalCenterData);
    return response.data;
  },

  /**
   * Elimina un centro médico por su ID.
   * @param id El ID del centro médico a eliminar.
   * @returns Promesa que resuelve cuando el centro médico ha sido eliminado.
   */
  deleteMedicalCenter: async (id: string): Promise<void> => {
    await api.delete(`/medical-centers/${id}`);
  },

  /**
   * Exporta centros médicos a un archivo Excel.
   * @param params Parámetros de consulta para filtrar los datos a exportar.
   * @returns Promesa que resuelve con un Blob que contiene el archivo Excel.
   */
  exportMedicalCentersToExcel: async (
    params: MedicalCenterQueryParams
  ): Promise<Blob> => {
    const response = await api.get("/medical-centers/export/excel", {
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },

  /**
   * Exporta centros médicos a un archivo Word.
   * @param params Parámetros de consulta para filtrar los datos a exportar.
   * @returns Promesa que resuelve con un Blob que contiene el archivo Word.
   */
  exportMedicalCentersToWord: async (
    params: MedicalCenterQueryParams
  ): Promise<Blob> => {
    const response = await api.get("/medical-centers/export/word", {
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },
};

export default MedicalCenterService;
