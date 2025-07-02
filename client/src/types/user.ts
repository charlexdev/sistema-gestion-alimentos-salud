// src/types/user.ts
// Interfaz para los valores del formulario de usuario
export interface UserFormValues {
  username: string;
  email: string;
  password: string; // Cambiado de 'password?: string;' a 'password: string;'
  role: "admin" | "user";
}

// Interfaz para los parámetros de consulta de la API de usuarios (paginación, búsqueda, etc.)
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "admin" | "user";
}

// Interfaz para la respuesta paginada de la API de usuarios
export interface PaginatedUsersResponse {
  users: Array<import("@/api/schemas/user").User>;
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
