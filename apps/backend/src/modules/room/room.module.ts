import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { BedService } from './bed.service';
import { RoomDashboardService } from './room-dashboard.service';
import { RoomGateway } from './room.gateway';
import { RoomEventHandler } from './room-event.handler';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RoomController],
  providers: [RoomService, BedService, RoomDashboardService, RoomGateway, RoomEventHandler],
  exports: [RoomService, BedService, RoomDashboardService, RoomGateway],
})
export class RoomModule {}
