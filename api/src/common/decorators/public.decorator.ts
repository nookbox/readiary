import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// @Public() 이 붙은 라우트는 BetterAuthGuard 가 인증을 건너뛴다.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
