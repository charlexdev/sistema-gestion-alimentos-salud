// client/src/hooks/useFoods.ts
import { useQuery } from "@tanstack/react-query";
import foodService from "@/api/services/food"; // Asegúrate de que la ruta sea correcta
import type { IFood, FoodQueryParams } from "@/types/food"; // Asegúrate de que la ruta sea correcta

interface FoodsResponse {
  data: IFood[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export const useFoods = (params: FoodQueryParams) => {
  return useQuery<FoodsResponse, Error>({
    queryKey: ["foods", params],
    queryFn: async () => {
      const response = await foodService.getFoods(params);
      return response;
    },
  });
};
