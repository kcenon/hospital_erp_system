import { Module } from '@nestjs/common';
import { LegacyPatientModule } from './legacy-patient';

@Module({
  imports: [LegacyPatientModule.forRoot({ adapterType: 'rest' })],
  exports: [LegacyPatientModule],
})
export class IntegrationModule {}
