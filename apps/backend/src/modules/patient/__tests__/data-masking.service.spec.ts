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

  describe('maskSsn', () => {
    it('should mask SSN with 13 digits', () => {
      const result = service.maskSsn('9001011234567');
      expect(result).toBe('900101-1******');
    });

    it('should mask SSN with dash', () => {
      const result = service.maskSsn('900101-1234567');
      expect(result).toBe('900101-1******');
    });

    it('should return full SSN for ADMIN role', () => {
      const result = service.maskSsn('900101-1234567', 'ADMIN');
      expect(result).toBe('900101-1234567');
    });

    it('should return null for null input', () => {
      const result = service.maskSsn(null);
      expect(result).toBeNull();
    });
  });

  describe('maskInsuranceNumber', () => {
    it('should mask insurance number showing last 4 digits', () => {
      const result = service.maskInsuranceNumber('123456789012');
      expect(result).toBe('********9012');
    });

    it('should return full number for ADMIN role', () => {
      const result = service.maskInsuranceNumber('123456789012', 'ADMIN');
      expect(result).toBe('123456789012');
    });

    it('should mask short numbers completely', () => {
      const result = service.maskInsuranceNumber('1234');
      expect(result).toBe('****');
    });

    it('should return null for null input', () => {
      const result = service.maskInsuranceNumber(null);
      expect(result).toBeNull();
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
