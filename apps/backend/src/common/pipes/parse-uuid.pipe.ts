import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!uuidValidate(value) || uuidVersion(value) !== 4) {
      throw new BadRequestException(`Invalid UUID format: ${value}`);
    }
    return value;
  }
}
