export type AdmissionType = 'EMERGENCY' | 'SCHEDULED' | 'TRANSFER';
export type AdmissionStatus = 'ADMITTED' | 'TRANSFERRED' | 'DISCHARGED';
export type DischargeType = 'NORMAL' | 'TRANSFER' | 'ESCAPE' | 'DEATH';

export interface Transfer {
  id: string;
  admissionId: string;
  fromBedId: string;
  toBedId: string;
  transferDate: string;
  transferTime: string;
  reason: string;
  notes: string | null;
  transferredBy: string;
  createdAt: string;
}

export interface Discharge {
  id: string;
  admissionId: string;
  dischargeDate: string;
  dischargeTime: string;
  dischargeType: DischargeType;
  dischargeDiagnosis: string | null;
  dischargeSummary: string | null;
  followUpInstructions: string | null;
  followUpDate: string | null;
  dischargedBy: string;
  createdAt: string;
}

export interface Admission {
  id: string;
  patientId: string;
  bedId: string;
  admissionNumber: string;
  admissionDate: string;
  admissionTime: string;
  admissionType: AdmissionType;
  diagnosis: string | null;
  chiefComplaint: string | null;
  attendingDoctorId: string;
  primaryNurseId: string | null;
  status: AdmissionStatus;
  expectedDischargeDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  transfers?: Transfer[];
  discharge?: Discharge | null;
}

export interface PaginatedAdmissions {
  data: Admission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
