import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BedStatus } from '@prisma/client';
import { RoomDashboardService } from '../room-dashboard.service';
import { PrismaService } from '../../../prisma';
import {
  createTestBuilding,
  createTestFloor,
  createTestRoom,
  createEmptyBed,
  createOccupiedBed,
  createReservedBed,
  createMaintenanceBed,
} from '../../../../test/factories';
import { createMockPrismaService } from '../../../../test/utils';

describe('RoomDashboardService', () => {
  let service: RoomDashboardService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomDashboardService, { provide: PrismaService, useValue: prismaService }],
    }).compile();

    service = module.get<RoomDashboardService>(RoomDashboardService);

    jest.clearAllMocks();
  });

  describe('getFloorDashboard', () => {
    it('should return floor dashboard with summary', async () => {
      const floor = createTestFloor('building-id', {
        id: 'floor-id',
        floorNumber: 3,
        name: '3F',
        department: 'Internal Medicine',
      });
      const room = createTestRoom(floor.id, { id: 'room-id', roomNumber: '301' });
      const floorWithRooms = {
        ...floor,
        rooms: [
          {
            ...room,
            beds: [
              createEmptyBed(room.id),
              createOccupiedBed(room.id, 'admission-1'),
              createReservedBed(room.id),
              createMaintenanceBed(room.id),
            ],
          },
        ],
      };

      prismaService.floor.findUnique.mockResolvedValue(floorWithRooms);

      const result = await service.getFloorDashboard('floor-id');

      expect(result.floorId).toBe('floor-id');
      expect(result.floorNumber).toBe(3);
      expect(result.name).toBe('3F');
      expect(result.department).toBe('Internal Medicine');
      expect(result.summary.totalBeds).toBe(4);
      expect(result.summary.occupiedBeds).toBe(1);
      expect(result.summary.emptyBeds).toBe(1);
      expect(result.summary.reservedBeds).toBe(1);
      expect(result.summary.maintenanceBeds).toBe(1);
      expect(result.rooms.length).toBe(1);
    });

    it('should throw NotFoundException when floor not found', async () => {
      prismaService.floor.findUnique.mockResolvedValue(null);

      await expect(service.getFloorDashboard('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return zero counts when floor has no rooms', async () => {
      const floor = createTestFloor('building-id', { id: 'floor-id' });
      const floorWithNoRooms = {
        ...floor,
        rooms: [],
      };

      prismaService.floor.findUnique.mockResolvedValue(floorWithNoRooms);

      const result = await service.getFloorDashboard('floor-id');

      expect(result.summary.totalBeds).toBe(0);
      expect(result.summary.occupiedBeds).toBe(0);
      expect(result.summary.emptyBeds).toBe(0);
      expect(result.rooms.length).toBe(0);
    });

    it('should correctly map room data', async () => {
      const floor = createTestFloor('building-id', { id: 'floor-id' });
      const room = createTestRoom(floor.id, {
        id: 'room-id',
        roomNumber: '301',
        roomType: 'ICU',
      });
      const bed = createOccupiedBed(room.id, 'admission-1', {
        id: 'bed-id',
        bedNumber: 'A',
      });
      const floorWithRooms = {
        ...floor,
        rooms: [
          {
            ...room,
            beds: [bed],
          },
        ],
      };

      prismaService.floor.findUnique.mockResolvedValue(floorWithRooms);

      const result = await service.getFloorDashboard('floor-id');

      expect(result.rooms[0].id).toBe('room-id');
      expect(result.rooms[0].roomNumber).toBe('301');
      expect(result.rooms[0].roomType).toBe('ICU');
      expect(result.rooms[0].beds[0].id).toBe('bed-id');
      expect(result.rooms[0].beds[0].bedNumber).toBe('A');
      expect(result.rooms[0].beds[0].status).toBe(BedStatus.OCCUPIED);
    });
  });

  describe('getBuildingDashboard', () => {
    it('should return building dashboard with floor summaries', async () => {
      const building = createTestBuilding({
        id: 'building-id',
        code: 'A',
        name: 'Main Building',
      });
      const floor1 = createTestFloor(building.id, {
        id: 'floor-1',
        floorNumber: 1,
        name: '1F',
        department: 'Emergency',
      });
      const floor2 = createTestFloor(building.id, {
        id: 'floor-2',
        floorNumber: 2,
        name: '2F',
        department: 'Surgery',
      });
      const room1 = createTestRoom(floor1.id);
      const room2 = createTestRoom(floor2.id);

      const buildingWithFloors = {
        ...building,
        floors: [
          {
            ...floor1,
            rooms: [
              {
                ...room1,
                beds: [createEmptyBed(room1.id), createOccupiedBed(room1.id, 'admission-1')],
              },
            ],
          },
          {
            ...floor2,
            rooms: [
              {
                ...room2,
                beds: [
                  createEmptyBed(room2.id),
                  createEmptyBed(room2.id),
                  createOccupiedBed(room2.id, 'admission-2'),
                ],
              },
            ],
          },
        ],
      };

      prismaService.building.findUnique.mockResolvedValue(buildingWithFloors);

      const result = await service.getBuildingDashboard('building-id');

      expect(result.buildingId).toBe('building-id');
      expect(result.code).toBe('A');
      expect(result.name).toBe('Main Building');
      expect(result.summary.totalBeds).toBe(5);
      expect(result.summary.occupiedBeds).toBe(2);
      expect(result.summary.emptyBeds).toBe(3);
      expect(result.floors.length).toBe(2);
      expect(result.floors[0].summary.totalBeds).toBe(2);
      expect(result.floors[1].summary.totalBeds).toBe(3);
    });

    it('should throw NotFoundException when building not found', async () => {
      prismaService.building.findUnique.mockResolvedValue(null);

      await expect(service.getBuildingDashboard('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should handle building with no floors', async () => {
      const building = createTestBuilding({ id: 'building-id' });
      const buildingWithNoFloors = {
        ...building,
        floors: [],
      };

      prismaService.building.findUnique.mockResolvedValue(buildingWithNoFloors);

      const result = await service.getBuildingDashboard('building-id');

      expect(result.summary.totalBeds).toBe(0);
      expect(result.floors.length).toBe(0);
    });
  });

  describe('getAllBuildingsDashboard', () => {
    it('should return dashboards for all buildings', async () => {
      const building1 = createTestBuilding({ id: 'building-1', code: 'A' });
      const building2 = createTestBuilding({ id: 'building-2', code: 'B' });
      const floor1 = createTestFloor(building1.id, { id: 'floor-1' });
      const floor2 = createTestFloor(building2.id, { id: 'floor-2' });
      const room1 = createTestRoom(floor1.id);
      const room2 = createTestRoom(floor2.id);

      const buildings = [
        {
          ...building1,
          floors: [
            {
              ...floor1,
              rooms: [
                {
                  ...room1,
                  beds: [createEmptyBed(room1.id), createOccupiedBed(room1.id, 'admission-1')],
                },
              ],
            },
          ],
        },
        {
          ...building2,
          floors: [
            {
              ...floor2,
              rooms: [
                {
                  ...room2,
                  beds: [createEmptyBed(room2.id)],
                },
              ],
            },
          ],
        },
      ];

      prismaService.building.findMany.mockResolvedValue(buildings);

      const result = await service.getAllBuildingsDashboard();

      expect(result.length).toBe(2);
      expect(result[0].summary.totalBeds).toBe(2);
      expect(result[0].summary.occupiedBeds).toBe(1);
      expect(result[1].summary.totalBeds).toBe(1);
      expect(result[1].summary.emptyBeds).toBe(1);
    });

    it('should return empty array when no buildings', async () => {
      prismaService.building.findMany.mockResolvedValue([]);

      const result = await service.getAllBuildingsDashboard();

      expect(result).toEqual([]);
    });

    it('should calculate aggregated summary correctly', async () => {
      const building = createTestBuilding({ id: 'building-id' });
      const floor1 = createTestFloor(building.id, { id: 'floor-1' });
      const floor2 = createTestFloor(building.id, { id: 'floor-2' });
      const room1 = createTestRoom(floor1.id);
      const room2 = createTestRoom(floor2.id);

      const buildings = [
        {
          ...building,
          floors: [
            {
              ...floor1,
              rooms: [
                {
                  ...room1,
                  beds: [
                    createOccupiedBed(room1.id, 'admission-1'),
                    createOccupiedBed(room1.id, 'admission-2'),
                  ],
                },
              ],
            },
            {
              ...floor2,
              rooms: [
                {
                  ...room2,
                  beds: [
                    createEmptyBed(room2.id),
                    createReservedBed(room2.id),
                    createMaintenanceBed(room2.id),
                  ],
                },
              ],
            },
          ],
        },
      ];

      prismaService.building.findMany.mockResolvedValue(buildings);

      const result = await service.getAllBuildingsDashboard();

      expect(result[0].summary.totalBeds).toBe(5);
      expect(result[0].summary.occupiedBeds).toBe(2);
      expect(result[0].summary.emptyBeds).toBe(1);
      expect(result[0].summary.reservedBeds).toBe(1);
      expect(result[0].summary.maintenanceBeds).toBe(1);
    });
  });
});
