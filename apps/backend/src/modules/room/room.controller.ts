import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoomService } from './room.service';
import { BedService } from './bed.service';
import { RoomDashboardService } from './room-dashboard.service';
import { JwtAuthGuard } from '../../common/guards';
import { PermissionGuard } from '../auth/guards';
import { RequirePermission } from '../auth/decorators';
import { Permissions } from '../auth/constants';
import {
  FindAvailableBedsDto,
  UpdateBedStatusDto,
  BuildingResponseDto,
  FloorResponseDto,
  RoomResponseDto,
  BedResponseDto,
  BuildingDashboard,
  FloorDashboard,
} from './dto';

@ApiTags('rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('rooms')
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly bedService: BedService,
    private readonly roomDashboardService: RoomDashboardService,
  ) {}

  @RequirePermission(Permissions.ROOM_READ)
  @ApiOperation({ summary: 'Get all buildings' })
  @ApiResponse({ status: 200, description: 'Building list', type: [BuildingResponseDto] })
  @Get('buildings')
  async getAllBuildings() {
    return this.roomService.findAllBuildings();
  }

  @RequirePermission(Permissions.ROOM_READ)
  @ApiOperation({ summary: 'Get building by ID' })
  @ApiParam({ name: 'id', description: 'Building ID' })
  @ApiResponse({ status: 200, description: 'Building found', type: BuildingResponseDto })
  @ApiResponse({ status: 404, description: 'Building not found' })
  @Get('buildings/:id')
  async getBuildingById(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomService.findBuildingById(id);
  }

  @RequirePermission(Permissions.ROOM_READ)
  @ApiOperation({ summary: 'Get floors by building' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiResponse({ status: 200, description: 'Floor list', type: [FloorResponseDto] })
  @Get('buildings/:buildingId/floors')
  async getFloorsByBuilding(@Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.roomService.findFloorsByBuilding(buildingId);
  }

  @RequirePermission(Permissions.ROOM_READ)
  @ApiOperation({ summary: 'Get rooms by floor' })
  @ApiParam({ name: 'floorId', description: 'Floor ID' })
  @ApiResponse({ status: 200, description: 'Room list', type: [RoomResponseDto] })
  @Get('floors/:floorId/rooms')
  async getRoomsByFloor(@Param('floorId', ParseUUIDPipe) floorId: string) {
    return this.roomService.findRoomsByFloor(floorId);
  }

  @RequirePermission(Permissions.ROOM_READ)
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, description: 'Room found', type: RoomResponseDto })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @Get(':id')
  async getRoomById(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomService.findRoomById(id);
  }

  @RequirePermission(Permissions.ROOM_READ)
  @ApiOperation({ summary: 'Get available beds' })
  @ApiResponse({ status: 200, description: 'Available beds', type: [BedResponseDto] })
  @Get('beds/available')
  async getAvailableBeds(@Query() query: FindAvailableBedsDto) {
    return this.bedService.findAvailable(query);
  }

  @RequirePermission(Permissions.ROOM_READ)
  @ApiOperation({ summary: 'Get bed by ID' })
  @ApiParam({ name: 'id', description: 'Bed ID' })
  @ApiResponse({ status: 200, description: 'Bed found', type: BedResponseDto })
  @ApiResponse({ status: 404, description: 'Bed not found' })
  @Get('beds/:id')
  async getBedById(@Param('id', ParseUUIDPipe) id: string) {
    return this.bedService.findById(id);
  }

  @RequirePermission(Permissions.ROOM_ASSIGN)
  @ApiOperation({ summary: 'Update bed status' })
  @ApiParam({ name: 'id', description: 'Bed ID' })
  @ApiResponse({ status: 200, description: 'Bed status updated', type: BedResponseDto })
  @Patch('beds/:id/status')
  async updateBedStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBedStatusDto) {
    return this.bedService.updateStatus(id, dto);
  }

  @RequirePermission(Permissions.ROOM_ASSIGN)
  @ApiOperation({ summary: 'Occupy bed with admission' })
  @ApiParam({ name: 'id', description: 'Bed ID' })
  @ApiBody({ schema: { properties: { admissionId: { type: 'string', format: 'uuid' } } } })
  @ApiResponse({ status: 200, description: 'Bed occupied', type: BedResponseDto })
  @Post('beds/:id/occupy')
  async occupyBed(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('admissionId', ParseUUIDPipe) admissionId: string,
  ) {
    return this.bedService.occupy(id, admissionId);
  }

  @RequirePermission(Permissions.ROOM_ASSIGN)
  @ApiOperation({ summary: 'Release bed' })
  @ApiParam({ name: 'id', description: 'Bed ID' })
  @ApiResponse({ status: 200, description: 'Bed released', type: BedResponseDto })
  @Post('beds/:id/release')
  async releaseBed(@Param('id', ParseUUIDPipe) id: string) {
    return this.bedService.release(id);
  }

  @RequirePermission(Permissions.ROOM_ASSIGN)
  @ApiOperation({ summary: 'Reserve bed' })
  @ApiParam({ name: 'id', description: 'Bed ID' })
  @ApiResponse({ status: 200, description: 'Bed reserved', type: BedResponseDto })
  @Post('beds/:id/reserve')
  async reserveBed(@Param('id', ParseUUIDPipe) id: string) {
    return this.bedService.reserve(id);
  }

  @RequirePermission(Permissions.ROOM_ASSIGN)
  @ApiOperation({ summary: 'Set bed to maintenance' })
  @ApiParam({ name: 'id', description: 'Bed ID' })
  @ApiBody({ schema: { properties: { notes: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Bed set to maintenance', type: BedResponseDto })
  @Post('beds/:id/maintenance')
  async setMaintenance(@Param('id', ParseUUIDPipe) id: string, @Body('notes') notes?: string) {
    return this.bedService.setMaintenance(id, notes);
  }

  @RequirePermission(Permissions.ROOM_READ)
  @ApiOperation({ summary: 'Get all buildings dashboard' })
  @ApiResponse({ status: 200, description: 'Buildings dashboard', type: [BuildingDashboard] })
  @Get('dashboard/buildings')
  async getAllBuildingsDashboard() {
    return this.roomDashboardService.getAllBuildingsDashboard();
  }

  @RequirePermission(Permissions.ROOM_READ)
  @ApiOperation({ summary: 'Get building dashboard' })
  @ApiParam({ name: 'buildingId', description: 'Building ID' })
  @ApiResponse({ status: 200, description: 'Building dashboard', type: BuildingDashboard })
  @Get('dashboard/building/:buildingId')
  async getBuildingDashboard(@Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.roomDashboardService.getBuildingDashboard(buildingId);
  }

  @RequirePermission(Permissions.ROOM_READ)
  @ApiOperation({ summary: 'Get floor dashboard' })
  @ApiParam({ name: 'floorId', description: 'Floor ID' })
  @ApiResponse({ status: 200, description: 'Floor dashboard', type: FloorDashboard })
  @Get('dashboard/floor/:floorId')
  async getFloorDashboard(@Param('floorId', ParseUUIDPipe) floorId: string) {
    return this.roomDashboardService.getFloorDashboard(floorId);
  }
}
