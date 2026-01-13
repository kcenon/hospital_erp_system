import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class PatientNumberGenerator {
  constructor(private readonly prisma: PrismaService) {}

  async generate(): Promise<string> {
    const currentYear = new Date().getFullYear();

    const sequence = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.patientSequence.findUnique({
        where: { year: currentYear },
      });

      if (existing) {
        const updated = await tx.patientSequence.update({
          where: { year: currentYear },
          data: { lastValue: existing.lastValue + 1 },
        });
        return updated.lastValue;
      }

      const created = await tx.patientSequence.create({
        data: {
          year: currentYear,
          lastValue: 1,
        },
      });
      return created.lastValue;
    });

    return `P${currentYear}${sequence.toString().padStart(6, '0')}`;
  }

  parsePatientNumber(patientNumber: string): { year: number; sequence: number } | null {
    const match = patientNumber.match(/^P(\d{4})(\d{6})$/);
    if (!match) return null;

    return {
      year: parseInt(match[1], 10),
      sequence: parseInt(match[2], 10),
    };
  }
}
