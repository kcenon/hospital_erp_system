import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { User } from '@prisma/client';
import { AuthService, SessionService } from './services';
import { LocalAuthGuard } from './guards';
import { JwtAuthGuard } from '../../common/guards';
import {
  LoginDto,
  RefreshTokenDto,
  TokenResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
  SessionListResponseDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
} from './dto';
import { DeviceInfo, AuthenticatedUser } from './interfaces';
import { Public, CurrentUser } from '../../common/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 423, description: 'Account locked' })
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: Request, @Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = req.user as User;
    const ipAddress = this.getClientIp(req);
    const deviceInfo = this.getDeviceInfo(req, loginDto.deviceInfo);

    return this.authService.login(user, deviceInfo, ipAddress);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    const tokenPair = await this.authService.refreshTokens(refreshTokenDto.refreshToken);

    return new TokenResponseDto({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      tokenType: 'Bearer',
    });
  }

  @ApiOperation({ summary: 'Logout current session' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Logout successful', type: LogoutResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<LogoutResponseDto> {
    await this.authService.logout(user.sessionId);
    return new LogoutResponseDto();
  }

  @ApiOperation({ summary: 'Logout from all sessions' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Logged out from all sessions',
    type: LogoutResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: AuthenticatedUser): Promise<LogoutResponseDto> {
    await this.authService.logoutAll(user.id);
    return new LogoutResponseDto('Logged out from all sessions');
  }

  @ApiOperation({ summary: 'Get current user info' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Current user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser): Promise<AuthenticatedUser> {
    return user;
  }

  @ApiOperation({ summary: 'Get all sessions for current user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'List of user sessions', type: SessionListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@CurrentUser() user: AuthenticatedUser): Promise<SessionListResponseDto> {
    const sessions = await this.sessionService.getUserSessions(user.id, user.sessionId);

    return {
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        deviceInfo: s.deviceInfo,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity,
        isCurrent: s.isCurrent,
      })),
      total: sessions.length,
    };
  }

  @ApiOperation({ summary: 'Destroy specific session' })
  @ApiBearerAuth()
  @ApiParam({ name: 'sessionId', description: 'Session ID to destroy' })
  @ApiResponse({ status: 200, description: 'Session destroyed', type: LogoutResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async destroySession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
  ): Promise<LogoutResponseDto> {
    const session = await this.sessionService.get(sessionId);

    if (!session || session.userId !== user.id) {
      return new LogoutResponseDto('Session not found or unauthorized');
    }

    await this.sessionService.destroy(sessionId);
    return new LogoutResponseDto('Session destroyed');
  }

  @ApiOperation({ summary: 'Change password' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Password changed', type: ChangePasswordResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid current password or password requirements not met',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    await this.authService.changePassword(user.id, dto);
    return new ChangePasswordResponseDto();
  }

  /**
   * Extract client IP from request
   */
  private getClientIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
      return ips.trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  /**
   * Extract device info from request
   */
  private getDeviceInfo(req: Request, providedInfo?: Partial<DeviceInfo>): DeviceInfo {
    const userAgent = req.headers['user-agent'] || 'unknown';

    return {
      userAgent,
      deviceType: providedInfo?.deviceType || this.detectDeviceType(userAgent),
      browser: providedInfo?.browser || this.detectBrowser(userAgent),
      os: providedInfo?.os || this.detectOS(userAgent),
    };
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent: string): 'PC' | 'TABLET' | 'MOBILE' {
    const ua = userAgent.toLowerCase();
    if (/tablet|ipad/.test(ua)) {
      return 'TABLET';
    }
    if (/mobile|android|iphone/.test(ua)) {
      return 'MOBILE';
    }
    return 'PC';
  }

  /**
   * Detect browser from user agent
   */
  private detectBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Detect OS from user agent
   */
  private detectOS(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac os')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Unknown';
  }
}
