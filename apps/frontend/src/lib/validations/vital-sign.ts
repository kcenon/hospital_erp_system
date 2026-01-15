import { z } from 'zod';

export const vitalSignSchema = z.object({
  temperature: z
    .number()
    .min(30, 'Temperature must be at least 30°C')
    .max(45, 'Temperature must be at most 45°C')
    .nullable()
    .optional(),
  systolicBp: z
    .number()
    .int('Must be a whole number')
    .min(50, 'Systolic BP must be at least 50 mmHg')
    .max(250, 'Systolic BP must be at most 250 mmHg')
    .nullable()
    .optional(),
  diastolicBp: z
    .number()
    .int('Must be a whole number')
    .min(30, 'Diastolic BP must be at least 30 mmHg')
    .max(150, 'Diastolic BP must be at most 150 mmHg')
    .nullable()
    .optional(),
  pulseRate: z
    .number()
    .int('Must be a whole number')
    .min(30, 'Pulse rate must be at least 30 bpm')
    .max(200, 'Pulse rate must be at most 200 bpm')
    .nullable()
    .optional(),
  respiratoryRate: z
    .number()
    .int('Must be a whole number')
    .min(5, 'Respiratory rate must be at least 5 /min')
    .max(60, 'Respiratory rate must be at most 60 /min')
    .nullable()
    .optional(),
  oxygenSaturation: z
    .number()
    .int('Must be a whole number')
    .min(50, 'SpO2 must be at least 50%')
    .max(100, 'SpO2 must be at most 100%')
    .nullable()
    .optional(),
  bloodGlucose: z
    .number()
    .int('Must be a whole number')
    .min(0, 'Blood glucose must be positive')
    .nullable()
    .optional(),
  painScore: z
    .number()
    .int('Must be a whole number')
    .min(0, 'Pain score must be 0-10')
    .max(10, 'Pain score must be 0-10')
    .nullable()
    .optional(),
  consciousness: z.enum(['ALERT', 'VERBAL', 'PAIN', 'UNRESPONSIVE']).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type VitalSignFormData = z.infer<typeof vitalSignSchema>;

// Threshold values for abnormal alerts (used for pre-submit warnings)
export const vitalThresholds = {
  temperature: { low: 36.0, high: 37.5, veryHigh: 38.5 },
  oxygenSaturation: { critical: 90, low: 95 },
  systolicBp: { veryHigh: 180, high: 140, low: 90 },
  pulseRate: { high: 120, low: 50 },
  respiratoryRate: { high: 25, low: 12 },
  bloodGlucose: { high: 300, low: 70 },
  painScore: { high: 7 },
};

export function checkAbnormalValues(data: VitalSignFormData): string[] {
  const warnings: string[] = [];

  if (data.temperature !== null && data.temperature !== undefined) {
    if (data.temperature < vitalThresholds.temperature.low) {
      warnings.push('Low body temperature (Hypothermia)');
    } else if (data.temperature > vitalThresholds.temperature.veryHigh) {
      warnings.push('High fever detected');
    } else if (data.temperature > vitalThresholds.temperature.high) {
      warnings.push('Fever detected');
    }
  }

  if (data.oxygenSaturation !== null && data.oxygenSaturation !== undefined) {
    if (data.oxygenSaturation < vitalThresholds.oxygenSaturation.critical) {
      warnings.push('Critical low oxygen saturation');
    } else if (data.oxygenSaturation < vitalThresholds.oxygenSaturation.low) {
      warnings.push('Low oxygen saturation');
    }
  }

  if (data.systolicBp !== null && data.systolicBp !== undefined) {
    if (data.systolicBp >= vitalThresholds.systolicBp.veryHigh) {
      warnings.push('Hypertensive crisis');
    } else if (data.systolicBp >= vitalThresholds.systolicBp.high) {
      warnings.push('High blood pressure');
    } else if (data.systolicBp < vitalThresholds.systolicBp.low) {
      warnings.push('Low blood pressure');
    }
  }

  if (data.pulseRate !== null && data.pulseRate !== undefined) {
    if (data.pulseRate > vitalThresholds.pulseRate.high) {
      warnings.push('Tachycardia (high heart rate)');
    } else if (data.pulseRate < vitalThresholds.pulseRate.low) {
      warnings.push('Bradycardia (low heart rate)');
    }
  }

  if (data.respiratoryRate !== null && data.respiratoryRate !== undefined) {
    if (data.respiratoryRate > vitalThresholds.respiratoryRate.high) {
      warnings.push('Tachypnea (rapid breathing)');
    } else if (data.respiratoryRate < vitalThresholds.respiratoryRate.low) {
      warnings.push('Bradypnea (slow breathing)');
    }
  }

  if (data.bloodGlucose !== null && data.bloodGlucose !== undefined) {
    if (data.bloodGlucose > vitalThresholds.bloodGlucose.high) {
      warnings.push('Severe hyperglycemia');
    } else if (data.bloodGlucose < vitalThresholds.bloodGlucose.low) {
      warnings.push('Hypoglycemia');
    }
  }

  if (data.painScore !== null && data.painScore !== undefined) {
    if (data.painScore >= vitalThresholds.painScore.high) {
      warnings.push('Severe pain reported');
    }
  }

  return warnings;
}
