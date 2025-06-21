// client/src/types/provider.ts

export interface IProvider {
  _id: string;
  name: string;
  contactInfo?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderFormValues {
  name: string;
  contactInfo?: string;
  address?: string;
}

export interface ProviderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  // Añade cualquier otro parámetro de consulta aquí, ej. sortBy, sortOrder
}

// **ESTE ES EL CAMBIO CLAVE**
export interface ProviderListResponse {
  data: IProvider[]; // Un array de objetos IProvider
  totalItems: number; // El número total de elementos
  totalPages: number; // El número total de páginas (comúnmente usado para paginación)
  currentPage: number; // La página actual (comúnmente usado para paginación)
}
