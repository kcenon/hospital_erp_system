import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Building, Floor, Room } from '@prisma/client';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllBuildings(): Promise<Building[]> {
    return this.prisma.building.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async findBuildingById(id: string): Promise<Building> {
    const building = await this.prisma.building.findUnique({
      where: { id },
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

    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found`);
    }

    return building;
  }

  async findFloorsByBuilding(buildingId: string): Promise<Floor[]> {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new NotFoundException(`Building with ID ${buildingId} not found`);
    }

    return this.prisma.floor.findMany({
      where: {
        buildingId,
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
  }

  async findRoomsByFloor(floorId: string): Promise<Room[]> {
    const floor = await this.prisma.floor.findUnique({
      where: { id: floorId },
    });

    if (!floor) {
      throw new NotFoundException(`Floor with ID ${floorId} not found`);
    }

    return this.prisma.room.findMany({
      where: {
        floorId,
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
  }

  async findRoomById(id: string): Promise<Room> {
    const room = await this.prisma.room.findUnique({
      where: { id },
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

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }
}
