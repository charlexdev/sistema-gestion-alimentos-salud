// client/src/types/medicalCenter.ts

export interface IMedicalCenter {
  _id: string;
  name: string;
  address?: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalCenterFormValues {
  name: string;
  address: string;
  contactInfo: string;
}

export interface MedicalCenterQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  name?: string;
}

// *** IMPORTANTE: Esta interfaz DEBE estar aquí y EXPORTADA. ***
export interface MedicalCenterListResponse {
  medicalCenters: IMedicalCenter[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
