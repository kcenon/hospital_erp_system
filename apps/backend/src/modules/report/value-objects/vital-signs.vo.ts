import { InvalidVitalValueException } from '../exceptions';

/**
 * Alert severity level
 */
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Vital alert type
 */
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

/**
 * Vital alert structure
 */
export interface VitalAlert {
  type: VitalAlertType;
  value: number;
  severity: AlertSeverity;
  message: string;
}

/**
 * VitalSigns Value Object
 *
 * Encapsulates vital signs data with validation and abnormal value alert detection.
 * Reference: SDS Section 4.5.2 (Value Object Design)
 * Requirements: REQ-FR-030~035
 */
export class VitalSigns {
  constructor(
    public readonly temperature: number | null, // °C (30-45)
    public readonly systolicBp: number | null, // mmHg (50-250)
    public readonly diastolicBp: number | null, // mmHg (30-150)
    public readonly pulseRate: number | null, // bpm (30-200)
    public readonly respiratoryRate: number | null, // /min (5-60)
    public readonly oxygenSaturation: number | null, // % (50-100)
    public readonly bloodGlucose: number | null, // mg/dL (optional)
    public readonly painScore: number | null, // 0-10 (optional)
    public readonly consciousness: string | null, // ALERT, VERBAL, PAIN, UNRESPONSIVE
  ) {
    this.validate();
  }

  /**
   * Validates all vital sign values are within acceptable ranges
   * @throws InvalidVitalValueException if any value is out of range
   */
  private validate(): void {
    if (this.temperature !== null && (this.temperature < 30 || this.temperature > 45)) {
      throw new InvalidVitalValueException('temperature', this.temperature, '30-45°C');
    }

    if (this.systolicBp !== null && (this.systolicBp < 50 || this.systolicBp > 250)) {
      throw new InvalidVitalValueException('systolicBp', this.systolicBp, '50-250 mmHg');
    }

    if (this.diastolicBp !== null && (this.diastolicBp < 30 || this.diastolicBp > 150)) {
      throw new InvalidVitalValueException('diastolicBp', this.diastolicBp, '30-150 mmHg');
    }

    if (this.pulseRate !== null && (this.pulseRate < 30 || this.pulseRate > 200)) {
      throw new InvalidVitalValueException('pulseRate', this.pulseRate, '30-200 bpm');
    }

    if (this.respiratoryRate !== null && (this.respiratoryRate < 5 || this.respiratoryRate > 60)) {
      throw new InvalidVitalValueException('respiratoryRate', this.respiratoryRate, '5-60 /min');
    }

    if (
      this.oxygenSaturation !== null &&
      (this.oxygenSaturation < 50 || this.oxygenSaturation > 100)
    ) {
      throw new InvalidVitalValueException('oxygenSaturation', this.oxygenSaturation, '50-100%');
    }

    if (this.painScore !== null && (this.painScore < 0 || this.painScore > 10)) {
      throw new InvalidVitalValueException('painScore', this.painScore, '0-10');
    }

    const validConsciousness = ['ALERT', 'VERBAL', 'PAIN', 'UNRESPONSIVE'];
    if (this.consciousness !== null && !validConsciousness.includes(this.consciousness)) {
      throw new InvalidVitalValueException(
        'consciousness',
        this.consciousness,
        validConsciousness.join(', '),
      );
    }
  }

  /**
   * Detects abnormal values and returns alerts (REQ-FR-033)
   * Alert thresholds based on standard medical guidelines
   */
  getAlerts(): VitalAlert[] {
    const alerts: VitalAlert[] = [];

    // Temperature alerts
    if (this.temperature !== null) {
      if (this.temperature < 36.0) {
        alerts.push({
          type: 'HYPOTHERMIA',
          value: this.temperature,
          severity: 'MEDIUM',
          message: `Low body temperature: ${this.temperature}°C`,
        });
      } else if (this.temperature > 38.5) {
        alerts.push({
          type: 'HIGH_FEVER',
          value: this.temperature,
          severity: 'HIGH',
          message: `High fever: ${this.temperature}°C`,
        });
      } else if (this.temperature > 37.5) {
        alerts.push({
          type: 'FEVER',
          value: this.temperature,
          severity: 'LOW',
          message: `Fever: ${this.temperature}°C`,
        });
      }
    }

    // SpO2 alerts
    if (this.oxygenSaturation !== null) {
      if (this.oxygenSaturation < 90) {
        alerts.push({
          type: 'CRITICAL_HYPOXIA',
          value: this.oxygenSaturation,
          severity: 'CRITICAL',
          message: `Critical low oxygen saturation: ${this.oxygenSaturation}%`,
        });
      } else if (this.oxygenSaturation < 95) {
        alerts.push({
          type: 'HYPOXIA',
          value: this.oxygenSaturation,
          severity: 'HIGH',
          message: `Low oxygen saturation: ${this.oxygenSaturation}%`,
        });
      }
    }

    // Blood pressure alerts
    if (this.systolicBp !== null) {
      if (this.systolicBp >= 180) {
        alerts.push({
          type: 'HYPERTENSIVE_CRISIS',
          value: this.systolicBp,
          severity: 'CRITICAL',
          message: `Hypertensive crisis: ${this.systolicBp} mmHg`,
        });
      } else if (this.systolicBp >= 140) {
        alerts.push({
          type: 'HYPERTENSION',
          value: this.systolicBp,
          severity: 'HIGH',
          message: `High blood pressure: ${this.systolicBp} mmHg`,
        });
      } else if (this.systolicBp < 90) {
        alerts.push({
          type: 'HYPOTENSION',
          value: this.systolicBp,
          severity: 'HIGH',
          message: `Low blood pressure: ${this.systolicBp} mmHg`,
        });
      }
    }

    // Pulse rate alerts
    if (this.pulseRate !== null) {
      if (this.pulseRate > 120) {
        alerts.push({
          type: 'TACHYCARDIA',
          value: this.pulseRate,
          severity: 'MEDIUM',
          message: `Tachycardia: ${this.pulseRate} bpm`,
        });
      } else if (this.pulseRate < 50) {
        alerts.push({
          type: 'BRADYCARDIA',
          value: this.pulseRate,
          severity: 'MEDIUM',
          message: `Bradycardia: ${this.pulseRate} bpm`,
        });
      }
    }

    // Respiratory rate alerts
    if (this.respiratoryRate !== null) {
      if (this.respiratoryRate > 25) {
        alerts.push({
          type: 'TACHYPNEA',
          value: this.respiratoryRate,
          severity: 'MEDIUM',
          message: `Tachypnea: ${this.respiratoryRate} /min`,
        });
      } else if (this.respiratoryRate < 12) {
        alerts.push({
          type: 'BRADYPNEA',
          value: this.respiratoryRate,
          severity: 'MEDIUM',
          message: `Bradypnea: ${this.respiratoryRate} /min`,
        });
      }
    }

    // Blood glucose alerts
    if (this.bloodGlucose !== null) {
      if (this.bloodGlucose > 300) {
        alerts.push({
          type: 'HYPERGLYCEMIA',
          value: this.bloodGlucose,
          severity: 'HIGH',
          message: `Severe hyperglycemia: ${this.bloodGlucose} mg/dL`,
        });
      } else if (this.bloodGlucose < 70) {
        alerts.push({
          type: 'HYPOGLYCEMIA',
          value: this.bloodGlucose,
          severity: 'HIGH',
          message: `Hypoglycemia: ${this.bloodGlucose} mg/dL`,
        });
      }
    }

    // Pain score alerts
    if (this.painScore !== null && this.painScore >= 7) {
      alerts.push({
        type: 'SEVERE_PAIN',
        value: this.painScore,
        severity: 'HIGH',
        message: `Severe pain: ${this.painScore}/10`,
      });
    }

    return alerts;
  }

  /**
   * Checks if there are any alerts
   */
  hasAlert(): boolean {
    return this.getAlerts().length > 0;
  }

  /**
   * Gets only critical alerts
   */
  getCriticalAlerts(): VitalAlert[] {
    return this.getAlerts().filter((a) => a.severity === 'CRITICAL');
  }

  /**
   * Gets the highest severity level among all alerts
   */
  getHighestSeverity(): AlertSeverity | null {
    const alerts = this.getAlerts();
    if (alerts.length === 0) return null;

    const severityOrder: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    for (const severity of severityOrder) {
      if (alerts.some((a) => a.severity === severity)) {
        return severity;
      }
    }
    return null;
  }
}
