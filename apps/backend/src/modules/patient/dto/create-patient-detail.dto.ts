import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePatientDetailDto {
  @IsOptional()
  @IsString()
  ssn?: string;

  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  insuranceType?: string;

  @IsOptional()
  @IsString()
  insuranceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  insuranceCompany?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
