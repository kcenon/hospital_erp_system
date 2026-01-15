import { Gender, AdmissionType, AdmissionStatus, Consciousness } from '@prisma/client';

export interface LatestVitalsDto {
  temperature: number | null;
  bloodPressure: string;
  pulseRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  consciousness: Consciousness | null;
  measuredAt: Date;
  hasAlert: boolean;
}

export interface RoundingPatientDto {
  admissionId: string;
  patient: {
    id: string;
    patientNumber: string;
    name: string;
    age: number;
    gender: Gender;
    birthDate: Date;
  };
  bed: {
    id: string;
    roomNumber: string;
    bedNumber: string;
    roomName: string | null;
  };
  admission: {
    diagnosis: string | null;
    chiefComplaint: string | null;
    admissionDate: Date;
    admissionDays: number;
    admissionType: AdmissionType;
    status: AdmissionStatus;
    attendingDoctorId: string;
  };
  latestVitals: LatestVitalsDto | null;
  previousRoundNote: string | null;
  existingRecordId: string | null;
  isVisited: boolean;
}

export class RoundingPatientListDto {
  roundId: string;
  roundNumber: string;
  patients: RoundingPatientDto[];
  totalPatients: number;
  visitedCount: number;
  progress: number;
}
