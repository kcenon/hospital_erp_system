import { IsDateString, IsNotEmpty } from 'class-validator';

/**
 * DTO for querying vital signs trend data (REQ-FR-032)
 */
export class GetTrendDto {
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}
