import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import {
  SessionData,
  SessionInfo,
  CreateSessionInput,
} from '../interfaces';
import {
  SessionExpiredException,
  SessionNotFoundException,
} from '../exceptions';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly IDLE_TIMEOUT = 30 * 60; // 30 minutes in seconds
  private readonly MAX_CONCURRENT_SESSIONS = 3;

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async create(input: CreateSessionInput): Promise<string> {
    const sessionId = uuidv4();
    const now = new Date();

    await this.checkConcurrentLimit(input.userId);

    const sessionData: SessionData = {
      userId: input.userId,
      username: input.username,
      roles: input.roles,
      deviceInfo: input.deviceInfo,
      ipAddress: input.ipAddress,
      createdAt: now,
      lastActivity: now,
    };

    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${input.userId}`;

    const pipeline = this.redis.pipeline();
    pipeline.hset(sessionKey, this.serializeSessionData(sessionData));
    pipeline.expire(sessionKey, this.IDLE_TIMEOUT);
    pipeline.sadd(userSessionsKey, sessionId);
    await pipeline.exec();

    this.logger.log(`Session created: ${sessionId} for user: ${input.userId}`);
    return sessionId;
  }

  async isValid(sessionId: string): Promise<boolean> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const exists = await this.redis.exists(sessionKey);
    return exists === 1;
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await this.redis.hgetall(sessionKey);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return this.deserializeSessionData(data);
  }

  async refresh(sessionId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const exists = await this.redis.exists(sessionKey);

    if (!exists) {
      throw new SessionExpiredException();
    }

    const now = new Date().toISOString();
    const pipeline = this.redis.pipeline();
    pipeline.hset(sessionKey, 'lastActivity', now);
    pipeline.expire(sessionKey, this.IDLE_TIMEOUT);
    await pipeline.exec();
  }

  async destroy(sessionId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const sessionData = await this.get(sessionId);

    if (!sessionData) {
      throw new SessionNotFoundException();
    }

    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${sessionData.userId}`;

    const pipeline = this.redis.pipeline();
    pipeline.del(sessionKey);
    pipeline.srem(userSessionsKey, sessionId);
    await pipeline.exec();

    this.logger.log(`Session destroyed: ${sessionId}`);
  }

  async destroyAllForUser(userId: string): Promise<void> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await this.redis.smembers(userSessionsKey);

    if (sessionIds.length === 0) {
      return;
    }

    const pipeline = this.redis.pipeline();
    for (const sessionId of sessionIds) {
      pipeline.del(`${this.SESSION_PREFIX}${sessionId}`);
    }
    pipeline.del(userSessionsKey);
    await pipeline.exec();

    this.logger.log(`All sessions destroyed for user: ${userId}`);
  }

  async getUserSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<SessionInfo[]> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await this.redis.smembers(userSessionsKey);

    const sessions: SessionInfo[] = [];

    for (const sessionId of sessionIds) {
      const sessionData = await this.get(sessionId);
      if (sessionData) {
        sessions.push({
          sessionId,
          deviceInfo: sessionData.deviceInfo,
          ipAddress: sessionData.ipAddress,
          createdAt: sessionData.createdAt,
          lastActivity: sessionData.lastActivity,
          isCurrent: sessionId === currentSessionId,
        });
      } else {
        await this.redis.srem(userSessionsKey, sessionId);
      }
    }

    return sessions.sort(
      (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime(),
    );
  }

  async checkConcurrentLimit(userId: string): Promise<boolean> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await this.redis.smembers(userSessionsKey);

    const validSessions: string[] = [];
    for (const sessionId of sessionIds) {
      const isValid = await this.isValid(sessionId);
      if (isValid) {
        validSessions.push(sessionId);
      } else {
        await this.redis.srem(userSessionsKey, sessionId);
      }
    }

    if (validSessions.length >= this.MAX_CONCURRENT_SESSIONS) {
      const oldestSession = await this.findOldestSession(validSessions);
      if (oldestSession) {
        await this.destroy(oldestSession);
        this.logger.log(
          `Oldest session removed for user ${userId}: ${oldestSession}`,
        );
      }
    }

    return true;
  }

  private async findOldestSession(sessionIds: string[]): Promise<string | null> {
    let oldestSessionId: string | null = null;
    let oldestTime: Date | null = null;

    for (const sessionId of sessionIds) {
      const sessionData = await this.get(sessionId);
      if (sessionData) {
        if (!oldestTime || sessionData.createdAt < oldestTime) {
          oldestTime = sessionData.createdAt;
          oldestSessionId = sessionId;
        }
      }
    }

    return oldestSessionId;
  }

  private serializeSessionData(
    data: SessionData,
  ): Record<string, string> {
    return {
      userId: data.userId,
      username: data.username,
      roles: JSON.stringify(data.roles),
      deviceInfo: JSON.stringify(data.deviceInfo),
      ipAddress: data.ipAddress,
      createdAt: data.createdAt.toISOString(),
      lastActivity: data.lastActivity.toISOString(),
    };
  }

  private deserializeSessionData(
    data: Record<string, string>,
  ): SessionData {
    return {
      userId: data.userId,
      username: data.username,
      roles: JSON.parse(data.roles),
      deviceInfo: JSON.parse(data.deviceInfo),
      ipAddress: data.ipAddress,
      createdAt: new Date(data.createdAt),
      lastActivity: new Date(data.lastActivity),
    };
  }
}
