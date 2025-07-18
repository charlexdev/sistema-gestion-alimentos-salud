// client/src/hooks/useFoodPlans.ts
import { useQuery } from "@tanstack/react-query";
import foodPlanService from "@/api/services/foodPlanService";
import type { FoodPlanQueryParams } from "@/types/foodPlan";

export const useFoodPlans = (params?: FoodPlanQueryParams) => {
  return useQuery({
    queryKey: ["foodPlans", params],
    queryFn: () => foodPlanService.getFoodPlans(params || {}),
    // Opciones adicionales si son necesarias
  });
};
