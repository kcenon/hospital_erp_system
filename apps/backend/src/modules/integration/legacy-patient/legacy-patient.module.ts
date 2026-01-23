import { Module, DynamicModule, Provider, InjectionToken } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PatientModule } from '../../patient/patient.module';
import { AuthModule } from '../../auth/auth.module';
import { LegacyPatientController } from './legacy-patient.controller';
import { LegacyCacheService, PatientSyncService } from './services';
import { JdbcLegacyAdapter, RestLegacyAdapter } from './adapters';
import { LEGACY_PATIENT_ADAPTER } from './interfaces';

export type LegacyAdapterType = 'jdbc' | 'rest' | 'mock';

export interface LegacyPatientModuleOptions {
  adapterType?: LegacyAdapterType;
  jdbcConnectionFactory?: () => Promise<unknown>;
}

@Module({})
export class LegacyPatientModule {
  static forRoot(options?: LegacyPatientModuleOptions): DynamicModule {
    const adapterType = options?.adapterType || 'rest';

    const adapterProvider = this.createAdapterProvider(adapterType, options);

    return {
      module: LegacyPatientModule,
      imports: [
        HttpModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            timeout: configService.get<number>('LEGACY_API_TIMEOUT', 10000),
            maxRedirects: 5,
          }),
        }),
        PatientModule,
        AuthModule,
      ],
      controllers: [LegacyPatientController],
      providers: [LegacyCacheService, PatientSyncService, adapterProvider],
      exports: [PatientSyncService, LEGACY_PATIENT_ADAPTER],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => Promise<LegacyPatientModuleOptions> | LegacyPatientModuleOptions;
    inject?: InjectionToken[];
  }): DynamicModule {
    const injectTokens: InjectionToken[] = [
      ...(options.inject || []),
      ConfigService,
      LegacyCacheService,
    ];

    return {
      module: LegacyPatientModule,
      imports: [
        HttpModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            timeout: configService.get<number>('LEGACY_API_TIMEOUT', 10000),
            maxRedirects: 5,
          }),
        }),
        PatientModule,
        AuthModule,
      ],
      controllers: [LegacyPatientController],
      providers: [
        LegacyCacheService,
        PatientSyncService,
        {
          provide: LEGACY_PATIENT_ADAPTER,
          useFactory: async (...args: unknown[]) => {
            const moduleOptions = await options.useFactory(...args);
            const adapterType = moduleOptions.adapterType || 'rest';

            if (adapterType === 'rest') {
              return new RestLegacyAdapter(
                args[0] as never,
                args[1] as ConfigService,
                args[2] as LegacyCacheService,
              );
            }

            return null;
          },
          inject: injectTokens,
        },
      ],
      exports: [PatientSyncService, LEGACY_PATIENT_ADAPTER],
    };
  }

  private static createAdapterProvider(
    adapterType: LegacyAdapterType,
    options?: LegacyPatientModuleOptions,
  ): Provider {
    switch (adapterType) {
      case 'jdbc':
        return {
          provide: LEGACY_PATIENT_ADAPTER,
          useFactory: (cacheService: LegacyCacheService, configService: ConfigService) => {
            const connectionFactory =
              options?.jdbcConnectionFactory || (() => Promise.resolve(null));
            return new JdbcLegacyAdapter(connectionFactory as never, cacheService, configService);
          },
          inject: [LegacyCacheService, ConfigService],
        };

      case 'rest':
      default:
        return {
          provide: LEGACY_PATIENT_ADAPTER,
          useClass: RestLegacyAdapter,
        };
    }
  }
}
