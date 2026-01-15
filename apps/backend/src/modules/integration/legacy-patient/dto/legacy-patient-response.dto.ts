export class DiagnosisDto {
  code: string;
  name: string;
  diagnosedAt: Date;
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
}

export class CurrentMedicationDto {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
}

export class SurgeryDto {
  name: string;
  performedAt: Date;
  hospital?: string;
  notes?: string;
}

export class LegacyPatientResponseDto {
  legacyId: string;
  name: string;
  birthDate: Date;
  gender: string;
  ssn?: string;
  phone?: string;
  address?: string;
  bloodType?: string;
  insuranceType?: string;
  insuranceNumber?: string;
}

export class MedicalHistoryResponseDto {
  legacyId: string;
  diagnoses: DiagnosisDto[];
  medications: CurrentMedicationDto[];
  allergies: string[];
  surgeries: SurgeryDto[];
  lastVisitDate?: Date;
}
