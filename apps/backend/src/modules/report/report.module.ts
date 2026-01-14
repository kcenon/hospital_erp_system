import { Module } from '@nestjs/common';
import { VitalSignController } from './vital-sign.controller';
import { VitalSignService } from './vital-sign.service';
import { VitalSignRepository } from './vital-sign.repository';
import { RoomModule } from '../room/room.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RoomModule, AuthModule],
  controllers: [VitalSignController],
  providers: [VitalSignService, VitalSignRepository],
  exports: [VitalSignService, VitalSignRepository],
})
export class ReportModule {}
