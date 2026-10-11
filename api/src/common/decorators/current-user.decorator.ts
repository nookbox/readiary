import {
  createParamDecorator,
  InternalServerErrorException,
  type ExecutionContext,
} from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

export const CurrentUser = createParamDecorator((_, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
  if (!request.user) {
    throw new InternalServerErrorException('@CurrentUser was used without auth guard');
  }
  return request.user;
});
