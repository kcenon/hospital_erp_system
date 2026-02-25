import { Module } from '@nestjs/common';
import { RoundController } from './rounding.controller';
import { RoundingService } from './rounding.service';
import { TabletRoundingService } from './tablet-rounding.service';
import { RoundingRepository } from './rounding.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RoundController],
  providers: [RoundingService, TabletRoundingService, RoundingRepository],
  exports: [RoundingService, TabletRoundingService, RoundingRepository],
})
export class RoundingModule {}
