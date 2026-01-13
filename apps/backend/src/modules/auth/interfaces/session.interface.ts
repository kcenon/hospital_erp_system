export type DeviceType = 'PC' | 'TABLET' | 'MOBILE';

export interface DeviceInfo {
  userAgent: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
}

export interface SessionData {
  userId: string;
  username: string;
  roles: string[];
  deviceInfo: DeviceInfo;
  ipAddress: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface SessionInfo {
  sessionId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  createdAt: Date;
  lastActivity: Date;
  isCurrent: boolean;
}

export interface CreateSessionInput {
  userId: string;
  username: string;
  roles: string[];
  deviceInfo: DeviceInfo;
  ipAddress: string;
}
