import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientDetailDto } from './create-patient-detail.dto';

export class UpdatePatientDetailDto extends PartialType(CreatePatientDetailDto) {}
