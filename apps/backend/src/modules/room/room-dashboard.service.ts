import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { BedStatus } from '@prisma/client';
import {
  FloorDashboard,
  BuildingDashboard,
  DashboardSummary,
  DashboardRoom,
} from './dto';

@Injectable()
export class RoomDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getFloorDashboard(floorId: string): Promise<FloorDashboard> {
    const floor = await this.prisma.floor.findUnique({
      where: { id: floorId },
      include: {
        rooms: {
          where: { isActive: true },
          orderBy: { roomNumber: 'asc' },
          include: {
            beds: {
              where: { isActive: true },
              orderBy: { bedNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!floor) {
      throw new NotFoundException(`Floor with ID ${floorId} not found`);
    }

    const rooms = this.buildDashboardRooms(floor.rooms);
    const summary = this.calculateSummary(floor.rooms);

    return {
      floorId: floor.id,
      floorNumber: floor.floorNumber,
      name: floor.name,
      department: floor.department,
      summary,
      rooms,
    };
  }

  async getBuildingDashboard(buildingId: string): Promise<BuildingDashboard> {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        floors: {
          where: { isActive: true },
          orderBy: { floorNumber: 'asc' },
          include: {
            rooms: {
              where: { isActive: true },
              include: {
                beds: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });

    if (!building) {
      throw new NotFoundException(`Building with ID ${buildingId} not found`);
    }

    const floors = building.floors.map((floor) => ({
      id: floor.id,
      floorNumber: floor.floorNumber,
      name: floor.name,
      department: floor.department,
      summary: this.calculateSummary(floor.rooms),
    }));

    const allRooms = building.floors.flatMap((floor) => floor.rooms);
    const summary = this.calculateSummary(allRooms);

    return {
      buildingId: building.id,
      code: building.code,
      name: building.name,
      summary,
      floors,
    };
  }

  async getAllBuildingsDashboard(): Promise<BuildingDashboard[]> {
    const buildings = await this.prisma.building.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
      include: {
        floors: {
          where: { isActive: true },
          orderBy: { floorNumber: 'asc' },
          include: {
            rooms: {
              where: { isActive: true },
              include: {
                beds: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });

    return buildings.map((building) => {
      const floors = building.floors.map((floor) => ({
        id: floor.id,
        floorNumber: floor.floorNumber,
        name: floor.name,
        department: floor.department,
        summary: this.calculateSummary(floor.rooms),
      }));

      const allRooms = building.floors.flatMap((floor) => floor.rooms);

      return {
        buildingId: building.id,
        code: building.code,
        name: building.name,
        summary: this.calculateSummary(allRooms),
        floors,
      };
    });
  }

  private buildDashboardRooms(
    rooms: Array<{
      id: string;
      roomNumber: string;
      roomType: string;
      beds: Array<{
        id: string;
        bedNumber: string;
        status: BedStatus;
        currentAdmissionId: string | null;
      }>;
    }>,
  ): DashboardRoom[] {
    return rooms.map((room) => ({
      id: room.id,
      roomNumber: room.roomNumber,
      roomType: room.roomType as DashboardRoom['roomType'],
      beds: room.beds.map((bed) => ({
        id: bed.id,
        bedNumber: bed.bedNumber,
        status: bed.status,
        patient: null,
      })),
    }));
  }

  private calculateSummary(
    rooms: Array<{
      beds: Array<{ status: BedStatus }>;
    }>,
  ): DashboardSummary {
    const allBeds = rooms.flatMap((room) => room.beds);

    return {
      totalBeds: allBeds.length,
      occupiedBeds: allBeds.filter((bed) => bed.status === BedStatus.OCCUPIED)
        .length,
      emptyBeds: allBeds.filter((bed) => bed.status === BedStatus.EMPTY).length,
      reservedBeds: allBeds.filter((bed) => bed.status === BedStatus.RESERVED)
        .length,
      maintenanceBeds: allBeds.filter(
        (bed) => bed.status === BedStatus.MAINTENANCE,
      ).length,
    };
  }
}
