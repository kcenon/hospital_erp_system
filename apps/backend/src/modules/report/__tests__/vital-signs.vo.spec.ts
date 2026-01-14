import { VitalSigns } from '../value-objects/vital-signs.vo';
import { InvalidVitalValueException } from '../exceptions';

describe('VitalSigns Value Object', () => {
  describe('validation', () => {
    it('should create valid vitals', () => {
      const vitals = new VitalSigns(
        36.5, // temperature
        120, // systolicBp
        80, // diastolicBp
        72, // pulseRate
        16, // respiratoryRate
        98, // oxygenSaturation
        100, // bloodGlucose
        0, // painScore
        'ALERT', // consciousness
      );

      expect(vitals.temperature).toBe(36.5);
      expect(vitals.systolicBp).toBe(120);
      expect(vitals.oxygenSaturation).toBe(98);
    });

    it('should allow null values', () => {
      const vitals = new VitalSigns(36.5, null, null, null, null, null, null, null, null);

      expect(vitals.temperature).toBe(36.5);
      expect(vitals.systolicBp).toBeNull();
    });

    it('should throw on invalid temperature below range', () => {
      expect(() => new VitalSigns(29, null, null, null, null, null, null, null, null)).toThrow(
        InvalidVitalValueException,
      );
    });

    it('should throw on invalid temperature above range', () => {
      expect(() => new VitalSigns(46, null, null, null, null, null, null, null, null)).toThrow(
        InvalidVitalValueException,
      );
    });

    it('should throw on invalid systolicBp below range', () => {
      expect(() => new VitalSigns(null, 49, null, null, null, null, null, null, null)).toThrow(
        InvalidVitalValueException,
      );
    });

    it('should throw on invalid systolicBp above range', () => {
      expect(() => new VitalSigns(null, 251, null, null, null, null, null, null, null)).toThrow(
        InvalidVitalValueException,
      );
    });

    it('should throw on invalid oxygenSaturation below range', () => {
      expect(() => new VitalSigns(null, null, null, null, null, 49, null, null, null)).toThrow(
        InvalidVitalValueException,
      );
    });

    it('should throw on invalid painScore', () => {
      expect(() => new VitalSigns(null, null, null, null, null, null, null, 11, null)).toThrow(
        InvalidVitalValueException,
      );
    });

    it('should throw on invalid consciousness value', () => {
      expect(
        () => new VitalSigns(null, null, null, null, null, null, null, null, 'INVALID'),
      ).toThrow(InvalidVitalValueException);
    });
  });

  describe('alert detection', () => {
    it('should detect high fever alert', () => {
      const vitals = new VitalSigns(39.5, null, null, null, null, null, null, null, null);
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('HIGH_FEVER');
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should detect mild fever alert', () => {
      const vitals = new VitalSigns(37.8, null, null, null, null, null, null, null, null);
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('FEVER');
      expect(alerts[0].severity).toBe('LOW');
    });

    it('should detect hypothermia alert', () => {
      const vitals = new VitalSigns(35.5, null, null, null, null, null, null, null, null);
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('HYPOTHERMIA');
      expect(alerts[0].severity).toBe('MEDIUM');
    });

    it('should detect critical hypoxia', () => {
      const vitals = new VitalSigns(null, null, null, null, null, 88, null, null, null);
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('CRITICAL_HYPOXIA');
      expect(alerts[0].severity).toBe('CRITICAL');
    });

    it('should detect moderate hypoxia', () => {
      const vitals = new VitalSigns(null, null, null, null, null, 92, null, null, null);
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('HYPOXIA');
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should detect hypertensive crisis', () => {
      const vitals = new VitalSigns(null, 185, null, null, null, null, null, null, null);
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('HYPERTENSIVE_CRISIS');
      expect(alerts[0].severity).toBe('CRITICAL');
    });

    it('should detect hypertension', () => {
      const vitals = new VitalSigns(null, 150, null, null, null, null, null, null, null);
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('HYPERTENSION');
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should detect hypotension', () => {
      const vitals = new VitalSigns(null, 85, null, null, null, null, null, null, null);
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('HYPOTENSION');
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should detect tachycardia', () => {
      const vitals = new VitalSigns(null, null, null, 130, null, null, null, null, null);
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('TACHYCARDIA');
      expect(alerts[0].severity).toBe('MEDIUM');
    });

    it('should detect bradycardia', () => {
      const vitals = new VitalSigns(null, null, null, 45, null, null, null, null, null);
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('BRADYCARDIA');
      expect(alerts[0].severity).toBe('MEDIUM');
    });

    it('should detect severe pain', () => {
      const vitals = new VitalSigns(null, null, null, null, null, null, null, 8, null);
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('SEVERE_PAIN');
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should return multiple alerts', () => {
      const vitals = new VitalSigns(
        39.8, // high fever
        190, // hypertensive crisis
        null,
        135, // tachycardia
        null,
        87, // critical hypoxia
        null,
        null,
        null,
      );
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(4);
      expect(alerts.map((a) => a.type)).toContain('HIGH_FEVER');
      expect(alerts.map((a) => a.type)).toContain('HYPERTENSIVE_CRISIS');
      expect(alerts.map((a) => a.type)).toContain('TACHYCARDIA');
      expect(alerts.map((a) => a.type)).toContain('CRITICAL_HYPOXIA');
    });

    it('should return no alerts for normal vitals', () => {
      const vitals = new VitalSigns(36.5, 120, 80, 72, 16, 98, 100, 2, 'ALERT');
      const alerts = vitals.getAlerts();

      expect(alerts.length).toBe(0);
    });
  });

  describe('helper methods', () => {
    it('should check hasAlert correctly', () => {
      const normalVitals = new VitalSigns(36.5, 120, 80, 72, 16, 98, null, null, null);
      const abnormalVitals = new VitalSigns(39.5, null, null, null, null, null, null, null, null);

      expect(normalVitals.hasAlert()).toBe(false);
      expect(abnormalVitals.hasAlert()).toBe(true);
    });

    it('should get critical alerts only', () => {
      const vitals = new VitalSigns(
        39.5, // high fever (HIGH)
        null,
        null,
        null,
        null,
        87, // critical hypoxia (CRITICAL)
        null,
        null,
        null,
      );
      const criticalAlerts = vitals.getCriticalAlerts();

      expect(criticalAlerts.length).toBe(1);
      expect(criticalAlerts[0].type).toBe('CRITICAL_HYPOXIA');
    });

    it('should get highest severity', () => {
      const vitals = new VitalSigns(
        37.8, // fever (LOW)
        145, // hypertension (HIGH)
        null,
        null,
        null,
        88, // critical hypoxia (CRITICAL)
        null,
        null,
        null,
      );

      expect(vitals.getHighestSeverity()).toBe('CRITICAL');
    });

    it('should return null for highest severity when no alerts', () => {
      const vitals = new VitalSigns(36.5, 120, 80, 72, 16, 98, null, null, null);

      expect(vitals.getHighestSeverity()).toBeNull();
    });
  });
});
