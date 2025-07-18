// client/src/hooks/useFoodEntries.ts
import { useQuery } from "@tanstack/react-query";
import FoodEntryService from "@/api/services/foodEntryService"; // Asegúrate de que la ruta sea correcta
import type { FoodEntryQueryParams } from "@/types/foodEntry"; // Asegúrate de que la ruta sea correcta

export const useFoodEntries = (params?: FoodEntryQueryParams) => {
  return useQuery({
    queryKey: ["foodEntries", params],
    queryFn: () => FoodEntryService.getFoodEntries(params || {}),
    // Opciones adicionales si son necesarias, por ejemplo, para refetching, caché, etc.
  });
};
