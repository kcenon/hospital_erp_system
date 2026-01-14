import { IsString, IsNotEmpty } from 'class-validator';

export class ImportPatientDto {
  @IsString()
  @IsNotEmpty()
  legacyId: string;
}
