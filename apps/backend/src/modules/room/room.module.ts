import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { BedService } from './bed.service';
import { RoomDashboardService } from './room-dashboard.service';

@Module({
  controllers: [RoomController],
  providers: [RoomService, BedService, RoomDashboardService],
  exports: [RoomService, BedService, RoomDashboardService],
})
export class RoomModule {}
