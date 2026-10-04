import 'dotenv/config';

import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { genericOAuth } from 'better-auth/plugins/generic-oauth';

import { db } from '@/db';
import { account, session, users, verification } from '@/db/schema';
import { backchannelLogout } from './backchannel-logout';

const providerId = process.env.OIDC_PROVIDER_ID ?? 'nook-auth';
const port = process.env.PORT ?? '4000';
const rpBaseUrl = process.env.BETTER_AUTH_URL ?? `http://localhost:${port}`;
const oidcIssuer = process.env.OIDC_ISSUER ?? 'http://localhost:3001/api/auth';
const discoveryUrl =
  process.env.OIDC_DISCOVERY_URL ?? `${oidcIssuer}/.well-known/openid-configuration`;

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  throw new Error('BETTER_AUTH_SECRET 이 설정되지 않았습니다. .env 를 확인하세요.');
}

const clientId = process.env.OIDC_CLIENT_ID;
if (!clientId) {
  throw new Error('OIDC_CLIENT_ID 가 설정되지 않았습니다. .env 를 확인하세요.');
}

const clientSecret = process.env.OIDC_CLIENT_SECRET;
if (!clientSecret) {
  throw new Error('OIDC_CLIENT_SECRET 이 설정되지 않았습니다. .env 를 확인하세요.');
}

// 모바일 앱 딥링크 (app.json 의 scheme). 로그인/에러/로그아웃 후 여기로 돌아간다.
const appUrl = process.env.APP_URL ?? 'readiary://';

const isDev = process.env.NODE_ENV !== 'production';

const trustedOrigins = [
  rpBaseUrl,
  appUrl,
  // Expo Go 는 exp://<로컬IP>:<포트> 로 뜬다.
  ...(isDev ? ['exp://', 'exp://**'] : []),
];

export const oauthProviderId = providerId;
export const oauthCallbackUrl = `${rpBaseUrl}/api/auth/callback/${providerId}`;

export const auth = betterAuth({
  appName: 'readiary',
  baseURL: rpBaseUrl,
  secret: authSecret,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: users, session, account, verification },
  }),
  trustedOrigins,
  advanced: {
    // 도메인 테이블(book_reports.user_id)이 uuid 라 better-auth 도 uuid 로 id 를 만든다.
    database: { generateId: 'uuid' },
    // 쿠키는 포트를 구분하지 않아 로컬에서 IdP·nookbox 쿠키와 덮어쓴다.
    cookiePrefix: 'readiary',
    cookies: {
      // OAuth state 쿠키 수명: 기본 300초(5분)는 로그인+회원가입 완주엔 짧음 → 15분.
      // 이 값을 넘겨 콜백이 오면 state 쿠키가 없어 state_mismatch가 난다.
      state: { attributes: { maxAge: 900 } },
    },
  },
  onAPIError: {
    errorURL: `${appUrl}auth/error`,
  },
  emailAndPassword: {
    enabled: false,
  },
  session: {
    additionalFields: {
      // backchannel-logout 플러그인이 쓴다. 외부 입력으로는 못 채운다.
      idpSid: { type: 'string', required: false, input: false },
    },
  },
  plugins: [
    // 네이티브 앱은 쿠키 저장소가 없어서 expo 클라이언트가 쿠키를 헤더로 실어 보낸다.
    expo(),
    genericOAuth({
      config: [
        {
          providerId,
          clientId,
          clientSecret,
          discoveryUrl,
          // discovery 가 issuer + jwks_uri 를 안 주면 부팅을 막는다.
          requireIdTokenVerification: true,
          scopes: ['openid', 'email', 'profile', 'offline_access'],
          pkce: true,
          overrideUserInfo: true,
          postLogoutRedirectURI: appUrl,
        },
      ],
    }),
    // IdP 로그아웃 통지를 받아 readiary 세션도 끊는다.
    backchannelLogout({
      issuer: oidcIssuer,
      clientId,
      providerId,
    }),
  ],
});
