import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT?: number = 3000;

  @IsString()
  DATABASE_URL: string;

  @ValidateIf((o) => o.NODE_ENV === Environment.Production)
  @IsString()
  REDIS_URL?: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRATION?: string = '1h';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRATION?: string = '7d';

  @ValidateIf((o) => o.NODE_ENV === Environment.Production)
  @IsString()
  @MinLength(32)
  ENCRYPTION_KEY?: string;

  @IsString()
  @IsOptional()
  LEGACY_DB_HOST?: string;

  @IsNumber()
  @IsOptional()
  LEGACY_DB_PORT?: number;

  @IsString()
  @IsOptional()
  LEGACY_DB_USER?: string;

  @IsString()
  @IsOptional()
  LEGACY_DB_PASSWORD?: string;

  @IsString()
  @IsOptional()
  LEGACY_DB_NAME?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  if (validatedConfig.NODE_ENV !== Environment.Production && !validatedConfig.ENCRYPTION_KEY) {
    console.warn(
      '[WARNING] ENCRYPTION_KEY is not set. Patient PII will not be encrypted. Set ENCRYPTION_KEY before deploying to production.',
    );
  }

  return validatedConfig;
}
