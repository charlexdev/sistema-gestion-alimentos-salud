// client/src/types/provider.ts

export interface IProvider {
  _id: string;
  name: string;
  // Estos campos reemplazan o complementan a 'contactInfo'
  email?: string;
  phoneNumber?: string; // Número de teléfono fijo de 8 dígitos
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderFormValues {
  name: string;
  // Estos campos reflejan los datos que se enviarán en el formulario
  email?: string;
  phoneNumber?: string;
  address?: string;
}

export interface ProviderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  // Añade cualquier otro parámetro de consulta aquí, ej. sortBy, sortOrder
}

export interface ProviderListResponse {
  data: IProvider[]; // Un array de objetos IProvider
  totalItems: number; // El número total de elementos
  totalPages: number; // El número total de páginas (comúnmente usado para paginación)
  currentPage: number; // La página actual (comúnmente usado para paginación)
}
