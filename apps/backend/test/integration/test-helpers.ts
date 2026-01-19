import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TEST_USERS } from './test-database';

/**
 * Login and get access token for a test user
 */
export async function loginAs(
  app: INestApplication,
  username: keyof typeof TEST_USERS,
): Promise<{ accessToken: string; refreshToken: string }> {
  const user = TEST_USERS[username];

  const response = await request(app.getHttpServer()).post('/auth/login').send({
    username: user.username,
    password: user.password,
  });

  if (response.status !== 200) {
    throw new Error(
      `Login failed for ${username}: ${response.status} - ${JSON.stringify(response.body)}`,
    );
  }

  return {
    accessToken: response.body.tokens.accessToken,
    refreshToken: response.body.tokens.refreshToken,
  };
}

/**
 * Create authenticated request with bearer token
 */
export function authRequest(
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  token: string,
): request.Test {
  return request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${token}`);
}

/**
 * Create request without authentication
 */
export function publicRequest(
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
): request.Test {
  return request(app.getHttpServer())[method](url);
}

/**
 * Wait for a specified time (ms)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
