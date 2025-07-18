// client/src/hooks/useProviders.ts
import { useQuery } from "@tanstack/react-query";
import providerService from "@/api/services/provider"; // Asegúrate de que la ruta sea correcta
import type { ProviderQueryParams } from "@/types/provider"; // Asegúrate de que la ruta sea correcta

export const useProviders = (params?: ProviderQueryParams) => {
  return useQuery({
    queryKey: ["providers", params],
    queryFn: () => providerService.getProviders(params || {}),
    // Opciones adicionales si son necesarias
  });
};
