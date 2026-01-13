import { Gender } from '@prisma/client';

export class PatientDetailResponseDto {
  id: string;
  ssn: string | null;
  medicalHistory: string | null;
  allergies: string | null;
  insuranceType: string | null;
  insuranceNumber: string | null;
  insuranceCompany: string | null;
  notes: string | null;
}

export class PatientResponseDto {
  id: string;
  patientNumber: string;
  name: string;
  birthDate: Date;
  gender: Gender;
  bloodType: string | null;
  phone: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  legacyPatientId: string | null;
  createdAt: Date;
  updatedAt: Date;
  detail?: PatientDetailResponseDto;
}

export class PaginatedPatientsResponseDto {
  data: PatientResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
