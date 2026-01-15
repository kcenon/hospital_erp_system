export type Consciousness = 'ALERT' | 'VERBAL' | 'PAIN' | 'UNRESPONSIVE';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type VitalAlertType =
  | 'HYPOTHERMIA'
  | 'FEVER'
  | 'HIGH_FEVER'
  | 'CRITICAL_HYPOXIA'
  | 'HYPOXIA'
  | 'HYPERTENSIVE_CRISIS'
  | 'HYPERTENSION'
  | 'HYPOTENSION'
  | 'TACHYCARDIA'
  | 'BRADYCARDIA'
  | 'TACHYPNEA'
  | 'BRADYPNEA'
  | 'HYPERGLYCEMIA'
  | 'HYPOGLYCEMIA'
  | 'SEVERE_PAIN';

export interface VitalAlert {
  type: VitalAlertType;
  value: number;
  severity: AlertSeverity;
  message: string;
}

export interface VitalSign {
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
  measuredAt: string;
  measuredBy: string;
  notes: string | null;
  hasAlert: boolean;
  alerts?: VitalAlert[];
  createdAt: string;
}

export interface PaginatedVitalSigns {
  data: VitalSign[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VitalTrend {
  labels: string[];
  temperature: (number | null)[];
  systolicBp: (number | null)[];
  diastolicBp: (number | null)[];
  pulseRate: (number | null)[];
  respiratoryRate: (number | null)[];
  oxygenSaturation: (number | null)[];
}

export interface RecordVitalSignsData {
  temperature?: number;
  systolicBp?: number;
  diastolicBp?: number;
  pulseRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  bloodGlucose?: number;
  painScore?: number;
  consciousness?: Consciousness;
  notes?: string;
  measuredAt?: string;
}

export interface GetVitalHistoryParams {
  startDate?: string;
  endDate?: string;
  hasAlert?: boolean;
  page?: number;
  limit?: number;
}

export interface GetTrendParams {
  startDate: string;
  endDate: string;
}
