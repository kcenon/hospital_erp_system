import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class CreatePatientDto {
  @ApiProperty({ description: 'Patient full name', example: 'John Doe', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Date of birth', example: '1990-01-15', format: 'date' })
  @IsNotEmpty()
  @IsDateString()
  birthDate: string;

  @ApiProperty({ description: 'Patient gender', enum: ['MALE', 'FEMALE'], example: 'MALE' })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ description: 'Blood type', example: 'A+', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  bloodType?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '010-1234-5678', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9-]+$/, { message: 'Phone must contain only numbers and hyphens' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Address', example: '123 Main St, Seoul' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact name',
    example: 'Jane Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactName?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact phone',
    example: '010-9876-5432',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9-]+$/, { message: 'Phone must contain only numbers and hyphens' })
  emergencyContactPhone?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact relation',
    example: 'Spouse',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContactRelation?: string;

  @ApiPropertyOptional({
    description: 'Legacy patient ID from previous system',
    example: 'OLD-001',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  legacyPatientId?: string;
}
