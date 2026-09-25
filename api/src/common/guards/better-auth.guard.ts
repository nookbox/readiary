import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import { type Request } from 'express';

import { auth } from '../../lib/auth';
import { type AuthenticatedUser } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // 모바일(expo 클라이언트)도 세션 쿠키를 Cookie 헤더로 실어 보내므로 같은 경로로 검증된다.
    const result = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!result?.user) {
      throw new UnauthorizedException('Authentication required');
    }

    request.user = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      image: result.user.image ?? null,
    };

    return true;
  }
}
