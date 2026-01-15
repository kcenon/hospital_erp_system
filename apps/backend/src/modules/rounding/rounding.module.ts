import { Module } from '@nestjs/common';
import { RoundController } from './rounding.controller';
import { RoundingService } from './rounding.service';
import { TabletRoundingService } from './tablet-rounding.service';
import { RoundingRepository } from './rounding.repository';

@Module({
  imports: [],
  controllers: [RoundController],
  providers: [RoundingService, TabletRoundingService, RoundingRepository],
  exports: [RoundingService, TabletRoundingService, RoundingRepository],
})
export class RoundingModule {}
