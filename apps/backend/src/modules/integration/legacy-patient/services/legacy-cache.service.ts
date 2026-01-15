import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { LegacyPatient, MedicalHistory } from '../interfaces';

const DEFAULT_TTL_SECONDS = 300; // 5 minutes as per REQ-FR-005

@Injectable()
export class LegacyCacheService {
  private readonly keyPrefix = 'legacy:patient:';

  constructor(@InjectRedis() private readonly redis: Redis) {}

  private buildKey(type: string, identifier: string): string {
    return `${this.keyPrefix}${type}:${identifier}`;
  }

  async getSearchResults(query: string): Promise<LegacyPatient[] | null> {
    const key = this.buildKey('search', this.hashQuery(query));
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached, this.dateReviver) : null;
  }

  async setSearchResults(
    query: string,
    results: LegacyPatient[],
    ttl: number = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    const key = this.buildKey('search', this.hashQuery(query));
    await this.redis.setex(key, ttl, JSON.stringify(results));
  }

  async getPatient(legacyId: string): Promise<LegacyPatient | null> {
    const key = this.buildKey('patient', legacyId);
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached, this.dateReviver) : null;
  }

  async setPatient(
    legacyId: string,
    patient: LegacyPatient,
    ttl: number = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    const key = this.buildKey('patient', legacyId);
    await this.redis.setex(key, ttl, JSON.stringify(patient));
  }

  async getMedicalHistory(legacyId: string): Promise<MedicalHistory | null> {
    const key = this.buildKey('history', legacyId);
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached, this.dateReviver) : null;
  }

  async setMedicalHistory(
    legacyId: string,
    history: MedicalHistory,
    ttl: number = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    const key = this.buildKey('history', legacyId);
    await this.redis.setex(key, ttl, JSON.stringify(history));
  }

  async invalidatePatient(legacyId: string): Promise<void> {
    const patientKey = this.buildKey('patient', legacyId);
    const historyKey = this.buildKey('history', legacyId);
    await this.redis.del(patientKey, historyKey);
  }

  async invalidateAllSearchResults(): Promise<void> {
    const pattern = `${this.keyPrefix}search:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private hashQuery(query: string): string {
    return Buffer.from(query.toLowerCase().trim()).toString('base64');
  }

  private dateReviver(_key: string, value: unknown): unknown {
    if (typeof value === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      if (dateRegex.test(value)) {
        return new Date(value);
      }
    }
    return value;
  }
}
