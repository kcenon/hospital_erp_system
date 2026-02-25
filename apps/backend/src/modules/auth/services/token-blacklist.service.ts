import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly BLACKLIST_PREFIX = 'token_blacklist:';

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Add a token to the blacklist with its remaining TTL
   */
  async blacklist(tokenJti: string, expiresInSeconds: number): Promise<void> {
    if (expiresInSeconds <= 0) {
      return;
    }

    const key = `${this.BLACKLIST_PREFIX}${tokenJti}`;
    await this.redis.set(key, '1', 'EX', expiresInSeconds);
    this.logger.log(`Token blacklisted: ${tokenJti} (TTL: ${expiresInSeconds}s)`);
  }

  /**
   * Check if a token is blacklisted
   */
  async isBlacklisted(tokenJti: string): Promise<boolean> {
    const key = `${this.BLACKLIST_PREFIX}${tokenJti}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Blacklist all tokens for a user by storing a "revoke before" timestamp
   */
  async revokeAllForUser(userId: string, ttlSeconds: number): Promise<void> {
    const key = `${this.BLACKLIST_PREFIX}user:${userId}`;
    const revokedAt = Math.floor(Date.now() / 1000);
    await this.redis.set(key, revokedAt.toString(), 'EX', ttlSeconds);
    this.logger.log(`All tokens revoked for user: ${userId}`);
  }

  /**
   * Check if a user's tokens issued before a certain time are revoked
   */
  async isUserTokenRevoked(userId: string, tokenIssuedAt: number): Promise<boolean> {
    const key = `${this.BLACKLIST_PREFIX}user:${userId}`;
    const revokedAt = await this.redis.get(key);

    if (!revokedAt) {
      return false;
    }

    return tokenIssuedAt <= parseInt(revokedAt, 10);
  }
}
