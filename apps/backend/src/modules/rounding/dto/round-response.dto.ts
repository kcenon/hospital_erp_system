import { RoundType, RoundStatus, RoundPatientStatus } from '@prisma/client';

export class RoundRecordResponseDto {
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
  visitedAt: Date | null;
  visitDuration: number | null;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class RoundResponseDto {
  id: string;
  roundNumber: string;
  floorId: string;
  roundType: RoundType;
  scheduledDate: Date;
  scheduledTime: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  pausedAt: Date | null;
  status: RoundStatus;
  leadDoctorId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  records: RoundRecordResponseDto[];
  validTransitions: RoundStatus[];
}

export class PaginatedRoundsResponseDto {
  data: RoundResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
