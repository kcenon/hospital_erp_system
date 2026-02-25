import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ThrottlerStorage } from '@nestjs/throttler';

interface StorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class ThrottlerRedisStorageService implements ThrottlerStorage, OnModuleInit {
  private scriptSha: string;

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Lua script for atomic increment with TTL and block duration.
   * Returns [totalHits, timeToExpire, isBlocked, timeToBlockExpire].
   */
  private readonly luaScript = `
    local key = KEYS[1]
    local blockKey = KEYS[2]
    local ttl = tonumber(ARGV[1])
    local limit = tonumber(ARGV[2])
    local blockDuration = tonumber(ARGV[3])

    -- Check if blocked
    local blockTTL = redis.call('PTTL', blockKey)
    if blockTTL > 0 then
      local hits = tonumber(redis.call('GET', key) or 0)
      return {hits, 0, 1, blockTTL}
    end

    -- Increment hits
    local hits = redis.call('INCR', key)
    if hits == 1 then
      redis.call('PEXPIRE', key, ttl)
    end

    local pttl = redis.call('PTTL', key)
    if pttl < 0 then
      pttl = ttl
    end

    -- Block if over limit
    if hits > limit and blockDuration > 0 then
      redis.call('SET', blockKey, 1, 'PX', blockDuration)
      return {hits, pttl, 1, blockDuration}
    end

    return {hits, pttl, 0, 0}
  `;

  async onModuleInit() {
    this.scriptSha = (await this.redis.script('LOAD', this.luaScript)) as string;
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<StorageRecord> {
    const blockKey = `${key}:blocked`;
    const results = (await this.redis.evalsha(
      this.scriptSha,
      2,
      key,
      blockKey,
      ttl,
      limit,
      blockDuration,
    )) as number[];

    return {
      totalHits: results[0],
      timeToExpire: results[1],
      isBlocked: results[2] === 1,
      timeToBlockExpire: results[3],
    };
  }
}
