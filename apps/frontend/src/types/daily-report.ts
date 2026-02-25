export interface StatsSummary {
  min: number;
  max: number;
  avg: number;
  count: number;
}

export interface BloodPressureStats {
  systolic: StatsSummary | null;
  diastolic: StatsSummary | null;
}

export interface VitalsSummary {
  measurementCount: number;
  temperature: StatsSummary | null;
  bloodPressure: BloodPressureStats;
  pulseRate: StatsSummary | null;
  respiratoryRate: StatsSummary | null;
  oxygenSaturation: StatsSummary | null;
  alertCount: number;
}

export interface IntakeBreakdown {
  oral: number;
  iv: number;
  tubeFeeding: number;
  other: number;
  total: number;
}

export interface OutputBreakdown {
  urine: number;
  stool: number;
  vomit: number;
  drainage: number;
  other: number;
  total: number;
}

export type IOBalanceStatusType = 'NORMAL' | 'POSITIVE' | 'NEGATIVE';

export interface IOBalanceSummary {
  intake: IntakeBreakdown;
  output: OutputBreakdown;
  balance: number;
  status: IOBalanceStatusType;
}

export interface MedicationCompliance {
  scheduled: number;
  administered: number;
  held: number;
  refused: number;
  missed: number;
  complianceRate: number;
}

import type { AlertSeverity } from './vital-sign';

export interface DailyAlert {
  type: string;
  severity: AlertSeverity;
  value: number;
  message: string;
  recordedAt: string;
}

export interface SignificantNote {
  id: string;
  noteType: string;
  summary: string;
  recordedAt: string;
}

export type PatientStatus = 'STABLE' | 'IMPROVING' | 'DECLINING' | 'CRITICAL' | 'GUARDED' | 'FAIR';

export interface DailyReport {
  id: string;
  admissionId: string;
  reportDate: string;
  vitalsSummary: VitalsSummary | null;
  totalIntake: number | null;
  totalOutput: number | null;
  ioBalance: number | null;
  medicationsGiven: number | null;
  medicationsHeld: number | null;
  patientStatus: PatientStatus | null;
  summary: string | null;
  alerts: DailyAlert[] | null;
  generatedAt: string;
  generatedBy: string | null;
}

export interface DailySummary {
  admissionId: string;
  date: string;
  vitalsSummary: VitalsSummary | null;
  ioBalance: IOBalanceSummary | null;
  medicationCompliance: MedicationCompliance;
  significantNotes: SignificantNote[];
  alerts: DailyAlert[];
  patientStatus: PatientStatus | null;
}

export interface PaginatedDailyReports {
  data: DailyReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListDailyReportsParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
