// src/api/services/user.service.ts

import api from "@/lib/axios"; // Asume que 'api' es tu instancia de Axios configurada
// Importamos directamente el tipo User de schemas/user para consistencia con el backend
import type { User } from "@/api/schemas/user";
import type {
  UserFormValues,
  UserQueryParams,
  PaginatedUsersResponse,
} from "@/types/user";

const UserService = {
  getUsers: async (
    params: UserQueryParams
  ): Promise<PaginatedUsersResponse> => {
    const response = await api.get("/users", { params });
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: UserFormValues): Promise<User> => {
    const response = await api.post("/users", userData);
    return response.data;
  },

  updateUser: async (id: string, userData: UserFormValues): Promise<User> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  exportUsersToExcel: async (params: UserQueryParams): Promise<Blob> => {
    const response = await api.get("/users/export/excel", {
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },

  exportUsersToWord: async (params: UserQueryParams): Promise<Blob> => {
    const response = await api.get("/users/export/word", {
      params,
      responseType: "blob", // Importante para la descarga de archivos
    });
    return response.data;
  },
};

export default UserService;
