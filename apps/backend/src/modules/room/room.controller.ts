import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { BedService } from './bed.service';
import { RoomDashboardService } from './room-dashboard.service';
import { FindAvailableBedsDto, UpdateBedStatusDto } from './dto';

@Controller('rooms')
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly bedService: BedService,
    private readonly roomDashboardService: RoomDashboardService,
  ) {}

  @Get('buildings')
  async getAllBuildings() {
    return this.roomService.findAllBuildings();
  }

  @Get('buildings/:id')
  async getBuildingById(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomService.findBuildingById(id);
  }

  @Get('buildings/:buildingId/floors')
  async getFloorsByBuilding(
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
  ) {
    return this.roomService.findFloorsByBuilding(buildingId);
  }

  @Get('floors/:floorId/rooms')
  async getRoomsByFloor(@Param('floorId', ParseUUIDPipe) floorId: string) {
    return this.roomService.findRoomsByFloor(floorId);
  }

  @Get(':id')
  async getRoomById(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomService.findRoomById(id);
  }

  @Get('beds/available')
  async getAvailableBeds(@Query() query: FindAvailableBedsDto) {
    return this.bedService.findAvailable(query);
  }

  @Get('beds/:id')
  async getBedById(@Param('id', ParseUUIDPipe) id: string) {
    return this.bedService.findById(id);
  }

  @Patch('beds/:id/status')
  async updateBedStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBedStatusDto,
  ) {
    return this.bedService.updateStatus(id, dto);
  }

  @Post('beds/:id/occupy')
  async occupyBed(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('admissionId', ParseUUIDPipe) admissionId: string,
  ) {
    return this.bedService.occupy(id, admissionId);
  }

  @Post('beds/:id/release')
  async releaseBed(@Param('id', ParseUUIDPipe) id: string) {
    return this.bedService.release(id);
  }

  @Post('beds/:id/reserve')
  async reserveBed(@Param('id', ParseUUIDPipe) id: string) {
    return this.bedService.reserve(id);
  }

  @Post('beds/:id/maintenance')
  async setMaintenance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes?: string,
  ) {
    return this.bedService.setMaintenance(id, notes);
  }

  @Get('dashboard/buildings')
  async getAllBuildingsDashboard() {
    return this.roomDashboardService.getAllBuildingsDashboard();
  }

  @Get('dashboard/building/:buildingId')
  async getBuildingDashboard(
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
  ) {
    return this.roomDashboardService.getBuildingDashboard(buildingId);
  }

  @Get('dashboard/floor/:floorId')
  async getFloorDashboard(@Param('floorId', ParseUUIDPipe) floorId: string) {
    return this.roomDashboardService.getFloorDashboard(floorId);
  }
}
