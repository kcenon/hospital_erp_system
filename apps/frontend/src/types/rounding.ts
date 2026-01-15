// Rounding module type definitions

import type { Gender } from './patient';
import type { AdmissionType, AdmissionStatus } from './admission';
import type { Consciousness } from './vital-sign';

export type RoundType = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export type RoundStatus = 'PLANNED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export type RoundPatientStatus = 'STABLE' | 'IMPROVING' | 'DECLINING' | 'CRITICAL';

export interface RoundRecord {
  id: string;
  roundId: string;
  admissionId: string;
  visitOrder: number;
  patientStatus: RoundPatientStatus | null;
  chiefComplaint: string | null;
  observation: string | null;
  assessment: string | null;
  plan: string | null;
  orders: string | null;
  visitedAt: string | null;
  visitDuration: number | null;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Round {
  id: string;
  roundNumber: string;
  floorId: string;
  roundType: RoundType;
  scheduledDate: string;
  scheduledTime: string | null;
  startedAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
  status: RoundStatus;
  leadDoctorId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  records: RoundRecord[];
  validTransitions: RoundStatus[];
}

export interface PaginatedRounds {
  data: Round[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FindRoundsParams {
  floorId?: string;
  leadDoctorId?: string;
  status?: RoundStatus;
  roundType?: RoundType;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateRoundData {
  floorId: string;
  roundType: RoundType;
  scheduledDate: string;
  scheduledTime?: string;
  leadDoctorId: string;
  notes?: string;
}

export interface CreateRoundRecordData {
  admissionId: string;
  patientStatus?: RoundPatientStatus;
  chiefComplaint?: string;
  observation?: string;
  assessment?: string;
  plan?: string;
  orders?: string;
}

export interface UpdateRoundRecordData {
  patientStatus?: RoundPatientStatus;
  chiefComplaint?: string;
  observation?: string;
  assessment?: string;
  plan?: string;
  orders?: string;
}

// Rounding patient list types
export interface LatestVitals {
  temperature: number | null;
  bloodPressure: string;
  pulseRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  consciousness: Consciousness | null;
  measuredAt: string;
  hasAlert: boolean;
}

export interface RoundingPatientInfo {
  id: string;
  patientNumber: string;
  name: string;
  age: number;
  gender: Gender;
  birthDate: string;
}

export interface RoundingBedInfo {
  id: string;
  roomNumber: string;
  bedNumber: string;
  roomName: string | null;
}

export interface RoundingAdmissionInfo {
  diagnosis: string | null;
  chiefComplaint: string | null;
  admissionDate: string;
  admissionDays: number;
  admissionType: AdmissionType;
  status: AdmissionStatus;
  attendingDoctorId: string;
}

export interface RoundingPatient {
  admissionId: string;
  patient: RoundingPatientInfo;
  bed: RoundingBedInfo;
  admission: RoundingAdmissionInfo;
  latestVitals: LatestVitals | null;
  previousRoundNote: string | null;
  existingRecordId: string | null;
  isVisited: boolean;
}

export interface RoundingPatientList {
  roundId: string;
  roundNumber: string;
  patients: RoundingPatient[];
  totalPatients: number;
  visitedCount: number;
  progress: number;
}
