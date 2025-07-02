// client/src/api/services/medicalCenterService.ts

import api from "@/lib/axios";
import type {
  IMedicalCenter,
  MedicalCenterFormValues,
  MedicalCenterQueryParams,
  MedicalCenterListResponse,
} from "@/types/medicalCenter";

const MedicalCenterService = {
  /**
   * Obtiene una lista paginada de centros médicos.
   * @param params Parámetros de consulta para paginación, búsqueda, filtrado.
   * @returns Promesa que resuelve con la respuesta paginada de centros médicos.
   */
  getMedicalCenters: async (
    params: MedicalCenterQueryParams
  ): Promise<MedicalCenterListResponse> => {
    // La baseURL en axios.ts ya es 'http://localhost:5000/api',
    // por lo tanto, aquí solo necesitamos la parte '/medicalcenters' (plural, sin guion)
    const response = await api.get("/medicalcenters", { params }); // <-- ¡CORREGIDO!
    return response.data;
  },

  /**
   * Obtiene un centro médico por su ID.
   * @param id El ID del centro médico.
   * @returns Promesa que resuelve con el objeto del centro médico.
   */
  getMedicalCenterById: async (id: string): Promise<IMedicalCenter> => {
    const response = await api.get(`/medicalcenters/${id}`); // <-- ¡CORREGIDO!
    return response.data;
  },

  /**
   * Crea un nuevo centro médico.
   * @param medicalCenterData Los datos del nuevo centro médico.
   * @returns Promesa que resuelve con el objeto del centro médico creado.
   */
  createMedicalCenter: async (
    medicalCenterData: MedicalCenterFormValues
  ): Promise<IMedicalCenter> => {
    const response = await api.post("/medicalcenters", medicalCenterData); // <-- ¡CORREGIDO!
    return response.data;
  },

  /**
   * Actualiza un centro médico por su ID.
   * @param id El ID del centro médico a actualizar.
   * @param medicalCenterData Los datos actualizados del centro médico.
   * @returns Promesa que resuelve con el objeto del centro médico actualizado.
   */
  updateMedicalCenter: async (
    id: string,
    medicalCenterData: MedicalCenterFormValues
  ): Promise<IMedicalCenter> => {
    const response = await api.put(`/medicalcenters/${id}`, medicalCenterData); // <-- ¡CORREGIDO!
    return response.data;
  },

  /**
   * Elimina un centro médico por su ID.
   * @param id El ID del centro médico a eliminar.
   * @returns Promesa que resuelve cuando el centro médico ha sido eliminado.
   */
  deleteMedicalCenter: async (id: string): Promise<void> => {
    await api.delete(`/medicalcenters/${id}`); // <-- ¡CORREGIDO!
  },

  /**
   * Exporta centros médicos a un archivo Excel.
   * @param params Parámetros de consulta para filtrar los datos a exportar.
   * @returns Promesa que resuelve con un Blob que contiene el archivo Excel.
   */
  exportMedicalCentersToExcel: async (
    params: MedicalCenterQueryParams
  ): Promise<Blob> => {
    const response = await api.get("/medicalcenters/export/excel", {
      // <-- ¡CORREGIDO!
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
    const response = await api.get("/medicalcenters/export/word", {
      // <-- ¡CORREGIDO!
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },
};

export default MedicalCenterService;
