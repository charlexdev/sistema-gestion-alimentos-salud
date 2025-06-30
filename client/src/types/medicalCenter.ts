// client/src/types/medicalCenter.ts

export interface IMedicalCenter {
  _id: string;
  name: string;
  address: string;
  email?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalCenterFormValues {
  name: string;
  address: string;
  email?: string;
  phoneNumber?: string;
}

export interface MedicalCenterQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  // Puedes añadir otros parámetros de consulta si son necesarios,
  // como filtrar por si tienen email o phoneNumber, etc.
}

export interface MedicalCenterListResponse {
  data: IMedicalCenter[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}
