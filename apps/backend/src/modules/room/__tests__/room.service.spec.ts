import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoomService } from '../room.service';
import { PrismaService } from '../../../prisma';
import {
  createTestBuilding,
  createTestFloor,
  createTestRoom,
  createTestBed,
} from '../../../../test/factories';
import { createMockPrismaService } from '../../../../test/utils';

describe('RoomService', () => {
  let service: RoomService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);

    jest.clearAllMocks();
  });

  describe('findAllBuildings', () => {
    it('should return all active buildings', async () => {
      const buildings = [
        createTestBuilding({ code: 'A' }),
        createTestBuilding({ code: 'B' }),
      ];

      prismaService.building.findMany.mockResolvedValue(buildings);

      const result = await service.findAllBuildings();

      expect(result.length).toBe(2);
      expect(prismaService.building.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      });
    });

    it('should return empty array when no buildings', async () => {
      prismaService.building.findMany.mockResolvedValue([]);

      const result = await service.findAllBuildings();

      expect(result).toEqual([]);
    });
  });

  describe('findBuildingById', () => {
    it('should return building with floors and rooms', async () => {
      const building = createTestBuilding({ id: 'building-id' });
      const floor = createTestFloor(building.id);
      const room = createTestRoom(floor.id);
      const buildingWithRelations = {
        ...building,
        floors: [
          {
            ...floor,
            rooms: [room],
          },
        ],
      };

      prismaService.building.findUnique.mockResolvedValue(buildingWithRelations);

      const result = await service.findBuildingById('building-id');

      expect(result.id).toBe('building-id');
      expect(prismaService.building.findUnique).toHaveBeenCalledWith({
        where: { id: 'building-id' },
        include: {
          floors: {
            where: { isActive: true },
            orderBy: { floorNumber: 'asc' },
            include: {
              rooms: {
                where: { isActive: true },
                orderBy: { roomNumber: 'asc' },
              },
            },
          },
        },
      });
    });

    it('should throw NotFoundException when building not found', async () => {
      prismaService.building.findUnique.mockResolvedValue(null);

      await expect(service.findBuildingById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findFloorsByBuilding', () => {
    it('should return floors for building', async () => {
      const building = createTestBuilding({ id: 'building-id' });
      const floors = [
        {
          ...createTestFloor(building.id, { floorNumber: 1 }),
          rooms: [createTestRoom('floor-1')],
        },
        {
          ...createTestFloor(building.id, { floorNumber: 2 }),
          rooms: [createTestRoom('floor-2')],
        },
      ];

      prismaService.building.findUnique.mockResolvedValue(building);
      prismaService.floor.findMany.mockResolvedValue(floors);

      const result = await service.findFloorsByBuilding('building-id');

      expect(result.length).toBe(2);
      expect(prismaService.floor.findMany).toHaveBeenCalledWith({
        where: {
          buildingId: 'building-id',
          isActive: true,
        },
        orderBy: { floorNumber: 'asc' },
        include: {
          rooms: {
            where: { isActive: true },
            orderBy: { roomNumber: 'asc' },
          },
        },
      });
    });

    it('should throw NotFoundException when building not found', async () => {
      prismaService.building.findUnique.mockResolvedValue(null);

      await expect(service.findFloorsByBuilding('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findRoomsByFloor', () => {
    it('should return rooms for floor with beds', async () => {
      const floor = createTestFloor('building-id', { id: 'floor-id' });
      const rooms = [
        {
          ...createTestRoom(floor.id, { roomNumber: '101' }),
          beds: [createTestBed('room-1')],
        },
        {
          ...createTestRoom(floor.id, { roomNumber: '102' }),
          beds: [createTestBed('room-2')],
        },
      ];

      prismaService.floor.findUnique.mockResolvedValue(floor);
      prismaService.room.findMany.mockResolvedValue(rooms);

      const result = await service.findRoomsByFloor('floor-id');

      expect(result.length).toBe(2);
      expect(prismaService.room.findMany).toHaveBeenCalledWith({
        where: {
          floorId: 'floor-id',
          isActive: true,
        },
        orderBy: { roomNumber: 'asc' },
        include: {
          beds: {
            where: { isActive: true },
            orderBy: { bedNumber: 'asc' },
          },
        },
      });
    });

    it('should throw NotFoundException when floor not found', async () => {
      prismaService.floor.findUnique.mockResolvedValue(null);

      await expect(service.findRoomsByFloor('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findRoomById', () => {
    it('should return room with floor, building, and beds', async () => {
      const building = createTestBuilding();
      const floor = createTestFloor(building.id);
      const room = createTestRoom(floor.id, { id: 'room-id' });
      const beds = [createTestBed(room.id), createTestBed(room.id)];
      const roomWithRelations = {
        ...room,
        floor: {
          ...floor,
          building,
        },
        beds,
      };

      prismaService.room.findUnique.mockResolvedValue(roomWithRelations);

      const result = await service.findRoomById('room-id');

      expect(result.id).toBe('room-id');
      expect(prismaService.room.findUnique).toHaveBeenCalledWith({
        where: { id: 'room-id' },
        include: {
          floor: {
            include: {
              building: true,
            },
          },
          beds: {
            where: { isActive: true },
            orderBy: { bedNumber: 'asc' },
          },
        },
      });
    });

    it('should throw NotFoundException when room not found', async () => {
      prismaService.room.findUnique.mockResolvedValue(null);

      await expect(service.findRoomById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
