export interface IntakeOutput {
  id: string;
  admissionId: string;
  recordDate: string;
  recordTime: string;
  oralIntake: number;
  ivIntake: number;
  tubeFeeding: number;
  otherIntake: number;
  totalIntake: number;
  urineOutput: number;
  stoolOutput: number;
  vomitOutput: number;
  drainageOutput: number;
  otherOutput: number;
  totalOutput: number;
  balance: number;
  recordedBy: string;
  notes: string | null;
  createdAt: string;
}

export interface PaginatedIntakeOutput {
  data: IntakeOutput[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RecordIOData {
  recordDate: string;
  recordTime: string;
  oralIntake?: number;
  ivIntake?: number;
  tubeFeeding?: number;
  otherIntake?: number;
  urineOutput?: number;
  stoolOutput?: number;
  vomitOutput?: number;
  drainageOutput?: number;
  otherOutput?: number;
  notes?: string;
}

export interface GetIOHistoryParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export type IOBalanceStatus = 'NORMAL' | 'POSITIVE' | 'NEGATIVE';

export interface IODailySummary {
  date: string;
  intake: {
    oral: number;
    iv: number;
    tubeFeeding: number;
    other: number;
    total: number;
  };
  output: {
    urine: number;
    stool: number;
    vomit: number;
    drainage: number;
    other: number;
    total: number;
  };
  balance: number;
  status: IOBalanceStatus;
}
