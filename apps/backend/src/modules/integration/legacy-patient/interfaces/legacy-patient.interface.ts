export interface Diagnosis {
  code: string;
  name: string;
  diagnosedAt: Date;
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
}

export interface CurrentMedication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
}

export interface Surgery {
  name: string;
  performedAt: Date;
  hospital?: string;
  notes?: string;
}

export interface LegacyPatient {
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

export interface MedicalHistory {
  legacyId: string;
  diagnoses: Diagnosis[];
  medications: CurrentMedication[];
  allergies: string[];
  surgeries: Surgery[];
  lastVisitDate?: Date;
}

export interface LegacyPatientAdapter {
  searchPatients(query: string): Promise<LegacyPatient[]>;
  findPatientById(legacyId: string): Promise<LegacyPatient | null>;
  getMedicalHistory(legacyId: string): Promise<MedicalHistory>;
  isConnected(): Promise<boolean>;
}

export const LEGACY_PATIENT_ADAPTER = Symbol('LEGACY_PATIENT_ADAPTER');
