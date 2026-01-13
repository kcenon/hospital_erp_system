import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '1h',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
