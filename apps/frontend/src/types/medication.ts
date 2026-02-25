export type MedicationRoute = 'PO' | 'IV' | 'IM' | 'SC' | 'SL' | 'TOP' | 'INH' | 'PR' | 'OTHER';

export type MedicationStatus = 'SCHEDULED' | 'ADMINISTERED' | 'HELD' | 'REFUSED' | 'MISSED';

export interface Medication {
  id: string;
  admissionId: string;
  medicationName: string;
  dosage: string;
  route: MedicationRoute;
  frequency: string | null;
  scheduledTime: string | null;
  administeredAt: string | null;
  administeredBy: string | null;
  status: MedicationStatus;
  holdReason: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PaginatedMedications {
  data: Medication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ScheduleMedicationData {
  medicationName: string;
  dosage: string;
  route: MedicationRoute;
  frequency?: string;
  scheduledTime?: string;
  notes?: string;
}

export interface AdministerMedicationData {
  administeredAt?: string;
  notes?: string;
}

export interface GetMedicationHistoryParams {
  startDate?: string;
  endDate?: string;
  status?: MedicationStatus;
  page?: number;
  limit?: number;
}
