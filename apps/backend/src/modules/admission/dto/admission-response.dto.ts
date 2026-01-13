import { AdmissionType, AdmissionStatus, DischargeType } from '@prisma/client';

export class TransferResponseDto {
  id: string;
  admissionId: string;
  fromBedId: string;
  toBedId: string;
  transferDate: Date;
  transferTime: string;
  reason: string;
  notes: string | null;
  transferredBy: string;
  createdAt: Date;
}

export class DischargeResponseDto {
  id: string;
  admissionId: string;
  dischargeDate: Date;
  dischargeTime: string;
  dischargeType: DischargeType;
  dischargeDiagnosis: string | null;
  dischargeSummary: string | null;
  followUpInstructions: string | null;
  followUpDate: Date | null;
  dischargedBy: string;
  createdAt: Date;
}

export class AdmissionResponseDto {
  id: string;
  patientId: string;
  bedId: string;
  admissionNumber: string;
  admissionDate: Date;
  admissionTime: string;
  admissionType: AdmissionType;
  diagnosis: string | null;
  chiefComplaint: string | null;
  attendingDoctorId: string;
  primaryNurseId: string | null;
  status: AdmissionStatus;
  expectedDischargeDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  transfers?: TransferResponseDto[];
  discharge?: DischargeResponseDto | null;
}

export class PaginatedAdmissionsResponseDto {
  data: AdmissionResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
