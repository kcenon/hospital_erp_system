import { PartialType } from '@nestjs/swagger';
import { CreatePatientDetailDto } from './create-patient-detail.dto';

export class UpdatePatientDetailDto extends PartialType(CreatePatientDetailDto) {}
