import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecordVitalSignsDto } from './record-vital-signs.dto';

/**
 * DTO for amending a vital signs record.
 * Creates a new corrected record referencing the original.
 */
export class AmendVitalSignsDto extends RecordVitalSignsDto {
  @ApiProperty({
    description: 'Reason for amending the vital signs record',
    example: 'Incorrect temperature reading due to faulty thermometer',
  })
  @IsString()
  reason: string;
}
