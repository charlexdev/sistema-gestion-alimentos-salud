// client/src/hooks/useUsersCount.ts
import { useState, useEffect, useCallback } from "react";
import userService from "@/api/services/user.service"; // Asegúrate de que la ruta sea correcta

interface UseUsersCountResult {
  usersCount: number | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export const useUsersCount = (): UseUsersCountResult => {
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsersCount = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      // Llamamos a getUsers pero con un limit bajo (e.g., 1)
      // porque solo nos interesa el totalItems que devuelve la API.
      const response = await userService.getUsers({ page: 1, limit: 1 });
      setUsersCount(response.totalItems);
    } catch (err) {
      console.error("Error fetching users count:", err);
      setIsError(true);
      setError(err as Error); // Asegúrate de que el error sea de tipo Error
      setUsersCount(0); // Establece 0 o null en caso de error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersCount();
  }, [fetchUsersCount]);

  return { usersCount, isLoading, isError, error };
};
