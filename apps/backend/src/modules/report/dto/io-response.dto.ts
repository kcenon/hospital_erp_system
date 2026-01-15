/**
 * Response DTO for IntakeOutput record
 */
export class IntakeOutputResponseDto {
  id: string;
  admissionId: string;
  recordDate: Date;
  recordTime: Date;

  // Intake
  oralIntake: number;
  ivIntake: number;
  tubeFeeding: number;
  otherIntake: number;
  totalIntake: number;

  // Output
  urineOutput: number;
  stoolOutput: number;
  vomitOutput: number;
  drainageOutput: number;
  otherOutput: number;
  totalOutput: number;

  // Balance
  balance: number;

  recordedBy: string;
  notes: string | null;
  createdAt: Date;
}

/**
 * Daily I/O Summary response
 */
export class IODailySummaryDto {
  date: Date;
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
  status: 'NORMAL' | 'POSITIVE' | 'NEGATIVE';
}

/**
 * I/O Balance for a date range
 */
export class IOBalanceDto {
  date: Date;
  totalIntake: number;
  totalOutput: number;
  balance: number;
  status: 'NORMAL' | 'POSITIVE' | 'NEGATIVE';
}

/**
 * Paginated I/O history response
 */
export class PaginatedIOResponseDto {
  data: IntakeOutputResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
