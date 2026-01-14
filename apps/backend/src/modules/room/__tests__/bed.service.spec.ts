import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BedStatus } from '@prisma/client';
import { BedService } from '../bed.service';
import { PrismaService } from '../../../prisma';
import {
  createTestBed,
  createEmptyBed,
  createOccupiedBed,
  createReservedBed,
  createMaintenanceBed,
  createTestRoom,
  createTestFloor,
  createTestBuilding,
} from '../../../../test/factories';
import { createMockPrismaService } from '../../../../test/utils';

describe('BedService', () => {
  let service: BedService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BedService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<BedService>(BedService);

    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return bed with room, floor, and building', async () => {
      const building = createTestBuilding();
      const floor = createTestFloor(building.id);
      const room = createTestRoom(floor.id);
      const bed = createEmptyBed(room.id, { id: 'bed-id' });
      const bedWithRelations = {
        ...bed,
        room: {
          ...room,
          floor: {
            ...floor,
            building,
          },
        },
      };

      prismaService.bed.findUnique.mockResolvedValue(bedWithRelations);

      const result = await service.findById('bed-id');

      expect(result.id).toBe('bed-id');
      expect(prismaService.bed.findUnique).toHaveBeenCalledWith({
        where: { id: 'bed-id' },
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
    });

    it('should throw NotFoundException when bed not found', async () => {
      prismaService.bed.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAvailable', () => {
    it('should return paginated available beds', async () => {
      const building = createTestBuilding();
      const floor = createTestFloor(building.id);
      const room = createTestRoom(floor.id);
      const beds = [
        createEmptyBed(room.id),
        createEmptyBed(room.id),
      ].map((bed) => ({
        ...bed,
        room: { ...room, floor: { ...floor, building } },
      }));

      prismaService.bed.findMany.mockResolvedValue(beds);
      prismaService.bed.count.mockResolvedValue(2);

      const result = await service.findAvailable({ page: 1, limit: 20 });

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by building', async () => {
      prismaService.bed.findMany.mockResolvedValue([]);
      prismaService.bed.count.mockResolvedValue(0);

      await service.findAvailable({ buildingId: 'building-id', page: 1, limit: 20 });

      expect(prismaService.bed.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            room: expect.objectContaining({
              floor: expect.objectContaining({
                building: expect.objectContaining({
                  id: 'building-id',
                }),
              }),
            }),
          }),
        }),
      );
    });

    it('should filter by floor', async () => {
      prismaService.bed.findMany.mockResolvedValue([]);
      prismaService.bed.count.mockResolvedValue(0);

      await service.findAvailable({ floorId: 'floor-id', page: 1, limit: 20 });

      expect(prismaService.bed.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            room: expect.objectContaining({
              floor: expect.objectContaining({
                id: 'floor-id',
              }),
            }),
          }),
        }),
      );
    });

    it('should filter by room type', async () => {
      prismaService.bed.findMany.mockResolvedValue([]);
      prismaService.bed.count.mockResolvedValue(0);

      await service.findAvailable({ roomType: 'ICU', page: 1, limit: 20 });

      expect(prismaService.bed.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            room: expect.objectContaining({
              roomType: 'ICU',
            }),
          }),
        }),
      );
    });

    it('should use default status EMPTY when not specified', async () => {
      prismaService.bed.findMany.mockResolvedValue([]);
      prismaService.bed.count.mockResolvedValue(0);

      await service.findAvailable({ page: 1, limit: 20 });

      expect(prismaService.bed.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: BedStatus.EMPTY,
          }),
        }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      prismaService.bed.findMany.mockResolvedValue([]);
      prismaService.bed.count.mockResolvedValue(45);

      const result = await service.findAvailable({ page: 1, limit: 20 });

      expect(result.totalPages).toBe(3);
    });
  });

  describe('updateStatus', () => {
    it('should update bed status with valid transition', async () => {
      const bed = createEmptyBed('room-id', { id: 'bed-id' });
      const updatedBed = { ...bed, status: BedStatus.OCCUPIED };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(updatedBed);

      const result = await service.updateStatus('bed-id', {
        status: BedStatus.OCCUPIED,
        currentAdmissionId: 'admission-id',
      });

      expect(result.status).toBe(BedStatus.OCCUPIED);
    });

    it('should throw BadRequestException for invalid transition', async () => {
      const bed = createOccupiedBed('room-id', 'admission-id', { id: 'bed-id' });

      prismaService.bed.findUnique.mockResolvedValue(bed);

      await expect(
        service.updateStatus('bed-id', {
          status: BedStatus.RESERVED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow EMPTY to OCCUPIED transition', async () => {
      const bed = createEmptyBed('room-id', { id: 'bed-id' });
      const updatedBed = { ...bed, status: BedStatus.OCCUPIED };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(updatedBed);

      const result = await service.updateStatus('bed-id', {
        status: BedStatus.OCCUPIED,
      });

      expect(result.status).toBe(BedStatus.OCCUPIED);
    });

    it('should allow EMPTY to RESERVED transition', async () => {
      const bed = createEmptyBed('room-id', { id: 'bed-id' });
      const updatedBed = { ...bed, status: BedStatus.RESERVED };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(updatedBed);

      const result = await service.updateStatus('bed-id', {
        status: BedStatus.RESERVED,
      });

      expect(result.status).toBe(BedStatus.RESERVED);
    });

    it('should allow EMPTY to MAINTENANCE transition', async () => {
      const bed = createEmptyBed('room-id', { id: 'bed-id' });
      const updatedBed = { ...bed, status: BedStatus.MAINTENANCE };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(updatedBed);

      const result = await service.updateStatus('bed-id', {
        status: BedStatus.MAINTENANCE,
      });

      expect(result.status).toBe(BedStatus.MAINTENANCE);
    });

    it('should allow OCCUPIED to EMPTY transition', async () => {
      const bed = createOccupiedBed('room-id', 'admission-id', { id: 'bed-id' });
      const updatedBed = { ...bed, status: BedStatus.EMPTY };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(updatedBed);

      const result = await service.updateStatus('bed-id', {
        status: BedStatus.EMPTY,
      });

      expect(result.status).toBe(BedStatus.EMPTY);
    });

    it('should allow RESERVED to OCCUPIED transition', async () => {
      const bed = createReservedBed('room-id', { id: 'bed-id' });
      const updatedBed = { ...bed, status: BedStatus.OCCUPIED };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(updatedBed);

      const result = await service.updateStatus('bed-id', {
        status: BedStatus.OCCUPIED,
      });

      expect(result.status).toBe(BedStatus.OCCUPIED);
    });

    it('should allow MAINTENANCE to EMPTY transition', async () => {
      const bed = createMaintenanceBed('room-id', { id: 'bed-id' });
      const updatedBed = { ...bed, status: BedStatus.EMPTY };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(updatedBed);

      const result = await service.updateStatus('bed-id', {
        status: BedStatus.EMPTY,
      });

      expect(result.status).toBe(BedStatus.EMPTY);
    });
  });

  describe('occupy', () => {
    it('should occupy empty bed', async () => {
      const bed = createEmptyBed('room-id', { id: 'bed-id' });
      const occupiedBed = {
        ...bed,
        status: BedStatus.OCCUPIED,
        currentAdmissionId: 'admission-id',
      };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(occupiedBed);

      const result = await service.occupy('bed-id', 'admission-id');

      expect(result.status).toBe(BedStatus.OCCUPIED);
      expect(result.currentAdmissionId).toBe('admission-id');
    });

    it('should occupy reserved bed', async () => {
      const bed = createReservedBed('room-id', { id: 'bed-id' });
      const occupiedBed = {
        ...bed,
        status: BedStatus.OCCUPIED,
        currentAdmissionId: 'admission-id',
      };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(occupiedBed);

      const result = await service.occupy('bed-id', 'admission-id');

      expect(result.status).toBe(BedStatus.OCCUPIED);
    });

    it('should throw when bed already occupied', async () => {
      const bed = createOccupiedBed('room-id', 'other-admission', { id: 'bed-id' });

      prismaService.bed.findUnique.mockResolvedValue(bed);

      await expect(service.occupy('bed-id', 'new-admission')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when bed is under maintenance', async () => {
      const bed = createMaintenanceBed('room-id', { id: 'bed-id' });

      prismaService.bed.findUnique.mockResolvedValue(bed);

      await expect(service.occupy('bed-id', 'admission-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('release', () => {
    it('should release occupied bed', async () => {
      const bed = createOccupiedBed('room-id', 'admission-id', { id: 'bed-id' });
      const releasedBed = {
        ...bed,
        status: BedStatus.EMPTY,
        currentAdmissionId: null,
      };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(releasedBed);

      const result = await service.release('bed-id');

      expect(result.status).toBe(BedStatus.EMPTY);
      expect(result.currentAdmissionId).toBeNull();
    });

    it('should throw when bed is not occupied', async () => {
      const bed = createEmptyBed('room-id', { id: 'bed-id' });

      prismaService.bed.findUnique.mockResolvedValue(bed);

      await expect(service.release('bed-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when releasing reserved bed', async () => {
      const bed = createReservedBed('room-id', { id: 'bed-id' });

      prismaService.bed.findUnique.mockResolvedValue(bed);

      await expect(service.release('bed-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reserve', () => {
    it('should reserve empty bed', async () => {
      const bed = createEmptyBed('room-id', { id: 'bed-id' });
      const reservedBed = { ...bed, status: BedStatus.RESERVED };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(reservedBed);

      const result = await service.reserve('bed-id');

      expect(result.status).toBe(BedStatus.RESERVED);
    });

    it('should throw when reserving non-empty bed', async () => {
      const bed = createOccupiedBed('room-id', 'admission-id', { id: 'bed-id' });

      prismaService.bed.findUnique.mockResolvedValue(bed);

      await expect(service.reserve('bed-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when reserving already reserved bed', async () => {
      const bed = createReservedBed('room-id', { id: 'bed-id' });

      prismaService.bed.findUnique.mockResolvedValue(bed);

      await expect(service.reserve('bed-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('setMaintenance', () => {
    it('should set maintenance on empty bed', async () => {
      const bed = createEmptyBed('room-id', { id: 'bed-id' });
      const maintenanceBed = {
        ...bed,
        status: BedStatus.MAINTENANCE,
        notes: 'Repair needed',
      };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(maintenanceBed);

      const result = await service.setMaintenance('bed-id', 'Repair needed');

      expect(result.status).toBe(BedStatus.MAINTENANCE);
      expect(result.notes).toBe('Repair needed');
    });

    it('should set maintenance on reserved bed', async () => {
      const bed = createReservedBed('room-id', { id: 'bed-id' });
      const maintenanceBed = { ...bed, status: BedStatus.MAINTENANCE };

      prismaService.bed.findUnique.mockResolvedValue(bed);
      prismaService.bed.update.mockResolvedValue(maintenanceBed);

      const result = await service.setMaintenance('bed-id');

      expect(result.status).toBe(BedStatus.MAINTENANCE);
    });

    it('should throw when setting maintenance on occupied bed', async () => {
      const bed = createOccupiedBed('room-id', 'admission-id', { id: 'bed-id' });

      prismaService.bed.findUnique.mockResolvedValue(bed);

      await expect(service.setMaintenance('bed-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
