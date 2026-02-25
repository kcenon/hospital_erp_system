import { DataMaskingService } from '../data-masking.service';

describe('DataMaskingService', () => {
  let service: DataMaskingService;

  beforeEach(() => {
    service = new DataMaskingService();
  });

  describe('maskPhone', () => {
    it('should mask phone number with 11 digits', () => {
      const result = service.maskPhone('01012345678');
      expect(result).toBe('010-****-5678');
    });

    it('should mask phone number with 10 digits', () => {
      const result = service.maskPhone('0212345678');
      expect(result).toBe('021-***-5678');
    });

    it('should handle phone with dashes', () => {
      const result = service.maskPhone('010-1234-5678');
      expect(result).toBe('010-****-5678');
    });

    it('should return null for null input', () => {
      const result = service.maskPhone(null);
      expect(result).toBeNull();
    });

    it('should return original for short numbers', () => {
      const result = service.maskPhone('123456');
      expect(result).toBe('123456');
    });
  });

  describe('maskPhone (role-based)', () => {
    it('should return unmasked phone for ADMIN role', () => {
      const result = service.maskPhone('01012345678', 'ADMIN');
      expect(result).toBe('01012345678');
    });

    it('should return unmasked phone for DOCTOR role', () => {
      const result = service.maskPhone('01012345678', 'DOCTOR');
      expect(result).toBe('01012345678');
    });

    it('should mask phone for NURSE role', () => {
      const result = service.maskPhone('01012345678', 'NURSE');
      expect(result).toBe('010-****-5678');
    });
  });

  describe('maskSsn', () => {
    it('should mask SSN with 13 digits', () => {
      const result = service.maskSsn('9001011234567');
      expect(result.value).toBe('900101-1******');
      expect(result.unmasked).toBe(false);
    });

    it('should mask SSN with dash', () => {
      const result = service.maskSsn('900101-1234567');
      expect(result.value).toBe('900101-1******');
      expect(result.unmasked).toBe(false);
    });

    it('should return full SSN for ADMIN role with unmasked flag', () => {
      const result = service.maskSsn('900101-1234567', 'ADMIN');
      expect(result.value).toBe('900101-1234567');
      expect(result.unmasked).toBe(true);
    });

    it('should return null value for null input', () => {
      const result = service.maskSsn(null);
      expect(result.value).toBeNull();
      expect(result.unmasked).toBe(false);
    });
  });

  describe('maskInsuranceNumber', () => {
    it('should mask insurance number showing last 4 digits', () => {
      const result = service.maskInsuranceNumber('123456789012');
      expect(result.value).toBe('********9012');
      expect(result.unmasked).toBe(false);
    });

    it('should return full number for ADMIN role with unmasked flag', () => {
      const result = service.maskInsuranceNumber('123456789012', 'ADMIN');
      expect(result.value).toBe('123456789012');
      expect(result.unmasked).toBe(true);
    });

    it('should mask short numbers completely', () => {
      const result = service.maskInsuranceNumber('1234');
      expect(result.value).toBe('****');
      expect(result.unmasked).toBe(false);
    });

    it('should return null value for null input', () => {
      const result = service.maskInsuranceNumber(null);
      expect(result.value).toBeNull();
      expect(result.unmasked).toBe(false);
    });
  });

  describe('maskAddress', () => {
    it('should mask address showing first two parts', () => {
      const result = service.maskAddress('Seoul Gangnam-gu Yeoksam-dong 123-45');
      expect(result).toBe('Seoul Gangnam-gu ***');
    });

    it('should return full address if two parts or less', () => {
      const result = service.maskAddress('Seoul Gangnam');
      expect(result).toBe('Seoul Gangnam');
    });

    it('should return null for null input', () => {
      const result = service.maskAddress(null);
      expect(result).toBeNull();
    });
  });
});
