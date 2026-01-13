import { Injectable } from '@nestjs/common';

export type UserRole = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF';

@Injectable()
export class DataMaskingService {
  maskPhone(phone: string | null): string | null {
    if (!phone) return null;

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) return phone;

    if (digits.length === 11) {
      return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
    }

    const visibleStart = digits.slice(0, 3);
    const visibleEnd = digits.slice(-4);
    const maskedMiddle = '*'.repeat(digits.length - 7);
    return `${visibleStart}-${maskedMiddle}-${visibleEnd}`;
  }

  maskSsn(ssn: string | null, role?: UserRole): string | null {
    if (!ssn) return null;

    if (role === 'ADMIN') {
      return ssn;
    }

    const digits = ssn.replace(/\D/g, '');
    if (digits.length === 13) {
      return `${digits.slice(0, 6)}-${digits.charAt(6)}******`;
    }

    return ssn.replace(/(\d{6})-?(\d)(\d{6})/, '$1-$2******');
  }

  maskInsuranceNumber(insuranceNumber: string | null, role?: UserRole): string | null {
    if (!insuranceNumber) return null;

    if (role === 'ADMIN') {
      return insuranceNumber;
    }

    if (insuranceNumber.length <= 4) {
      return '*'.repeat(insuranceNumber.length);
    }

    const visibleEnd = insuranceNumber.slice(-4);
    const maskedPart = '*'.repeat(insuranceNumber.length - 4);
    return maskedPart + visibleEnd;
  }

  maskAddress(address: string | null): string | null {
    if (!address) return null;

    const parts = address.split(' ');
    if (parts.length <= 2) {
      return address;
    }

    return parts.slice(0, 2).join(' ') + ' ***';
  }
}
