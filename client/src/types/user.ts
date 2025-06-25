// src/types/user.ts

// Interfaz para los valores del formulario de usuario
export interface UserFormValues {
  username: string;
  email: string;
  password?: string; // Opcional para edición, puede ser requerido para creación
  role: "admin" | "user";
}

// Interfaz para los parámetros de consulta de la API de usuarios (paginación, búsqueda, etc.)
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "admin" | "user"; // Para filtrar por rol si es necesario
}

// Interfaz para la respuesta paginada de la API de usuarios
// Importante: La interfaz `IUser` (o `User`) se tomará directamente de `@/api/schemas/user`
// para asegurar que el `id` o `_id` coincida con lo que el backend envía.
export interface PaginatedUsersResponse {
  users: Array<import("@/api/schemas/user").User>; // Referencia a la interfaz User de tu backend
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
