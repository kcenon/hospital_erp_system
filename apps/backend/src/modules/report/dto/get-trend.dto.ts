import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for querying vital signs trend data (REQ-FR-032)
 */
export class GetTrendDto {
  @ApiProperty({ description: 'Start date for trend data', example: '2024-01-01' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date for trend data', example: '2024-01-31' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}
