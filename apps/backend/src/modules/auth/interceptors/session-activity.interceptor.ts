import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SessionService } from '../services';

interface RequestUser {
  sessionId?: string;
  userId?: string;
}

@Injectable()
export class SessionActivityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SessionActivityInterceptor.name);

  constructor(private readonly sessionService: SessionService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;
    const sessionId = user?.sessionId;

    if (sessionId) {
      try {
        await this.sessionService.refresh(sessionId);
      } catch (_error) {
        this.logger.warn(`Failed to refresh session: ${sessionId}`);
      }
    }

    return next.handle();
  }
}
