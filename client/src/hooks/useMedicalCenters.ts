// client/src/hooks/useMedicalCenters.ts
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import medicalCenterService from "../api/services/medical-center";
// Asegúrate de que IMedicalCenter, MedicalCenterQueryParams y MedicalCenterListResponse
// estén correctamente importados desde el archivo que NO PUEDES cambiar.
import type {
  IMedicalCenter,
  MedicalCenterQueryParams,
  MedicalCenterListResponse,
} from "../types/medicalCenter";

// Clave de la consulta para react-query
const MEDICAL_CENTERS_QUERY_KEY = "medicalCenters";

export const useMedicalCenters = (
  queryParams?: MedicalCenterQueryParams, // Permite pasar parámetros de consulta
  options?: UseQueryOptions<IMedicalCenter[], Error>
) => {
  return useQuery<IMedicalCenter[], Error>({
    queryKey: [MEDICAL_CENTERS_QUERY_KEY, queryParams], // La clave puede incluir params para cachear diferentes resultados
    queryFn: async () => {
      // --- SOLUCIÓN PARA EL ERROR 1: 'queryParams' puede ser undefined ---
      // Si 'queryParams' es undefined, le pasamos un objeto vacío `{}`.
      // Dado que todas las propiedades en MedicalCenterQueryParams son OPCIONALES,
      // un objeto vacío es un MedicalCenterQueryParams válido y satisface la firma de la función.
      const actualQueryParams = queryParams || {};

      // Realiza la llamada al servicio.
      // Asumimos que `medicalCenterService.getMedicalCenters` está tipado para devolver
      // `Promise<MedicalCenterListResponse>`.
      const response: MedicalCenterListResponse =
        await medicalCenterService.getMedicalCenters(actualQueryParams);

      // --- SOLUCIÓN PARA EL ERROR 2: 'Property 'data' does not exist' ---
      // Tu interfaz `MedicalCenterListResponse` tiene la lista de centros médicos
      // en la propiedad `medicalCenters`, NO en `data`.
      // Por lo tanto, debemos acceder a `response.medicalCenters`.
      return response.medicalCenters; // <-- ¡Cambiado de .data a .medicalCenters!
    },
    staleTime: 5 * 60 * 1000, // Los datos se consideran "frescos" por 5 minutos
    ...(options || {}), // Se asegura de que options sea un objeto vacío si es undefined
  });
};

// Exporta la clave por si necesitas invalidar la caché desde otros componentes
export { MEDICAL_CENTERS_QUERY_KEY };
