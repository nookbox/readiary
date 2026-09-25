import {
  createParamDecorator,
  InternalServerErrorException,
  type ExecutionContext,
} from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

export const CurrentUser = createParamDecorator((_, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
  if (!request.user) {
    throw new InternalServerErrorException('@CurrentUser was used without auth guard');
  }
  return request.user;
});
