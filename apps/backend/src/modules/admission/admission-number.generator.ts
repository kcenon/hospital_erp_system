import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class AdmissionNumberGenerator {
  constructor(private readonly prisma: PrismaService) {}

  async generate(): Promise<string> {
    const currentYear = new Date().getFullYear();

    const sequence = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.admissionSequence.findUnique({
        where: { year: currentYear },
      });

      if (existing) {
        return tx.admissionSequence.update({
          where: { year: currentYear },
          data: { lastValue: { increment: 1 } },
        });
      }

      return tx.admissionSequence.create({
        data: { year: currentYear, lastValue: 1 },
      });
    });

    const sequenceNumber = String(sequence.lastValue).padStart(6, '0');
    return `A${currentYear}${sequenceNumber}`;
  }
}
