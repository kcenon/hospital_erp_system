import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Bed, BedStatus, Prisma } from '@prisma/client';
import { FindAvailableBedsDto, UpdateBedStatusDto } from './dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class BedService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Bed> {
    const bed = await this.prisma.bed.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (!bed) {
      throw new NotFoundException(`Bed with ID ${id} not found`);
    }

    return bed;
  }

  async findAvailable(params: FindAvailableBedsDto): Promise<PaginatedResult<Bed>> {
    const {
      buildingId,
      floorId,
      roomType,
      status = BedStatus.EMPTY,
      page = 1,
      limit = 20,
    } = params;

    const where: Prisma.BedWhereInput = {
      isActive: true,
      status,
      room: {
        isActive: true,
        ...(roomType && { roomType }),
        floor: {
          isActive: true,
          ...(floorId && { id: floorId }),
          building: {
            isActive: true,
            ...(buildingId && { id: buildingId }),
          },
        },
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.bed.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { bedNumber: 'asc' },
        include: {
          room: {
            include: {
              floor: {
                include: {
                  building: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.bed.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(id: string, dto: UpdateBedStatusDto): Promise<Bed> {
    const bed = await this.findById(id);

    this.validateStatusTransition(bed.status, dto.status);

    return this.prisma.bed.update({
      where: { id },
      data: {
        status: dto.status,
        currentAdmissionId: dto.currentAdmissionId ?? null,
        notes: dto.notes,
      },
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });
  }

  async occupy(bedId: string, admissionId: string): Promise<Bed> {
    const bed = await this.findById(bedId);

    if (bed.status !== BedStatus.EMPTY && bed.status !== BedStatus.RESERVED) {
      throw new BadRequestException(`Bed cannot be occupied. Current status: ${bed.status}`);
    }

    return this.prisma.bed.update({
      where: { id: bedId },
      data: {
        status: BedStatus.OCCUPIED,
        currentAdmissionId: admissionId,
      },
    });
  }

  async release(bedId: string): Promise<Bed> {
    const bed = await this.findById(bedId);

    if (bed.status !== BedStatus.OCCUPIED) {
      throw new BadRequestException(`Bed is not occupied. Current status: ${bed.status}`);
    }

    return this.prisma.bed.update({
      where: { id: bedId },
      data: {
        status: BedStatus.EMPTY,
        currentAdmissionId: null,
      },
    });
  }

  async reserve(bedId: string): Promise<Bed> {
    const bed = await this.findById(bedId);

    if (bed.status !== BedStatus.EMPTY) {
      throw new BadRequestException(`Bed cannot be reserved. Current status: ${bed.status}`);
    }

    return this.prisma.bed.update({
      where: { id: bedId },
      data: {
        status: BedStatus.RESERVED,
      },
    });
  }

  async setMaintenance(bedId: string, notes?: string): Promise<Bed> {
    const bed = await this.findById(bedId);

    if (bed.status === BedStatus.OCCUPIED) {
      throw new BadRequestException('Cannot set maintenance on occupied bed');
    }

    return this.prisma.bed.update({
      where: { id: bedId },
      data: {
        status: BedStatus.MAINTENANCE,
        notes,
      },
    });
  }

  private validateStatusTransition(currentStatus: BedStatus, newStatus: BedStatus): void {
    const allowedTransitions: Record<BedStatus, BedStatus[]> = {
      [BedStatus.EMPTY]: [BedStatus.OCCUPIED, BedStatus.RESERVED, BedStatus.MAINTENANCE],
      [BedStatus.OCCUPIED]: [BedStatus.EMPTY],
      [BedStatus.RESERVED]: [BedStatus.OCCUPIED, BedStatus.EMPTY, BedStatus.MAINTENANCE],
      [BedStatus.MAINTENANCE]: [BedStatus.EMPTY],
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
