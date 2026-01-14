export type Gender = 'MALE' | 'FEMALE';

export interface PatientDetail {
  id: string;
  ssn: string | null;
  medicalHistory: string | null;
  allergies: string | null;
  insuranceType: string | null;
  insuranceNumber: string | null;
  insuranceCompany: string | null;
  notes: string | null;
}

export interface Patient {
  id: string;
  patientNumber: string;
  name: string;
  birthDate: string;
  gender: Gender;
  bloodType: string | null;
  phone: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  legacyPatientId: string | null;
  createdAt: string;
  updatedAt: string;
  detail?: PatientDetail;
}

export interface PaginatedPatients {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FindPatientsParams {
  search?: string;
  name?: string;
  patientNumber?: string;
  gender?: Gender;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
