export type AdmissionType = 'EMERGENCY' | 'ELECTIVE' | 'TRANSFER';
export type AdmissionStatus = 'ACTIVE' | 'TRANSFERRED' | 'DISCHARGED';
export type DischargeType = 'NORMAL' | 'TRANSFER' | 'AMA' | 'DECEASED';

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

export interface CreateAdmissionData {
  patientId: string;
  bedId: string;
  admissionDate: string;
  admissionTime: string;
  admissionType: AdmissionType;
  diagnosis?: string;
  chiefComplaint?: string;
  attendingDoctorId: string;
  primaryNurseId?: string;
  expectedDischargeDate?: string;
  notes?: string;
}

export interface TransferData {
  toBedId: string;
  transferDate: string;
  transferTime: string;
  reason: string;
  notes?: string;
}

export interface DischargeData {
  dischargeDate: string;
  dischargeTime: string;
  dischargeType: DischargeType;
  dischargeDiagnosis?: string;
  dischargeSummary?: string;
  followUpInstructions?: string;
  followUpDate?: string;
}

export interface CreatePatientData {
  name: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  bloodType?: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}
