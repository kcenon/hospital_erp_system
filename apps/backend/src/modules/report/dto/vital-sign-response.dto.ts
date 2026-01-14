import { Consciousness } from '@prisma/client';
import { VitalAlert } from '../value-objects';

/**
 * Response DTO for vital sign record
 */
export class VitalSignResponseDto {
  id: string;
  admissionId: string;
  temperature: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  pulseRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  bloodGlucose: number | null;
  painScore: number | null;
  consciousness: Consciousness | null;
  measuredAt: Date;
  measuredBy: string;
  notes: string | null;
  hasAlert: boolean;
  alerts?: VitalAlert[];
  createdAt: Date;
}

/**
 * Paginated response for vital sign history
 */
export class PaginatedVitalSignsResponseDto {
  data: VitalSignResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Response DTO for vital signs trend data (REQ-FR-032)
 */
export class VitalTrendResponseDto {
  labels: Date[];
  temperature: (number | null)[];
  systolicBp: (number | null)[];
  diastolicBp: (number | null)[];
  pulseRate: (number | null)[];
  respiratoryRate: (number | null)[];
  oxygenSaturation: (number | null)[];
}
