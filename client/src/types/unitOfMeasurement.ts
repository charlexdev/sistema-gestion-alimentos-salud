// client/src/types/unitOfMeasurement.ts

// Interfaz para la estructura de una Unidad de Medida tal como viene del backend
export interface IUnitOfMeasurement {
  _id: string;
  name: string;
  symbol?: string; // Opcional, como en tu modelo de Mongoose
  createdAt: string;
  updatedAt: string;
}

// Interfaz para los valores del formulario de creación/edición de una Unidad de Medida
export interface UnitOfMeasurementFormValues {
  name: string;
  symbol?: string; // Opcional
}

// Interfaz para los parámetros de consulta al obtener unidades de medida (ej. paginación, búsqueda)
export interface UnitOfMeasurementQueryParams {
  page?: number;
  limit?: number;
  search?: string; // Para búsqueda general por nombre o símbolo
  name?: string; // Para filtrado exacto por nombre
}

// Interfaz para la respuesta de la lista de unidades de medida desde el backend (con paginación)
export interface UnitOfMeasurementListResponse {
  unitOfMeasurements: IUnitOfMeasurement[]; // La lista de unidades
  totalCount: number; // Número total de unidades (sin paginación)
  currentPage: number; // Página actual
  totalPages: number; // Total de páginas
}
