import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
} from 'better-auth/api';
import type { BetterAuthPlugin } from 'better-auth';
import {
  createRemoteJWKSet,
  decodeJwt,
  jwtVerify,
  type JWTPayload,
} from 'jose';
import * as z from 'zod';

const BACKCHANNEL_LOGOUT_EVENT =
  'http://schemas.openid.net/event/backchannel-logout';

/**
 * ⚠️ ctx.json(body, { status: 400 }) 은 먹지 않는다. better-call 이 두 번째
 *    인자를 버려서 200 이 나가고, IdP 는 통지가 성공한 줄 안다. APIError 필수.
 */
function reject(): APIError {
  return new APIError('BAD_REQUEST', { error: 'invalid_request' });
}

interface BackchannelLogoutOptions {
  issuer: string;
  /** 이 RP 의 client_id. logout_token 의 aud 가 이것과 일치해야 한다. */
  clientId: string;
  /** IdP 에 등록된 provider id */
  providerId: string;
}

export const backchannelLogout = (
  options: BackchannelLogoutOptions,
): BetterAuthPlugin => {
  const jwks = createRemoteJWKSet(new URL(`${options.issuer}/jwks`));

  return {
    id: 'backchannel-logout',
    /**
     * 로그인이 방금 끝났으면 id_token 의 sid(IdP 세션 식별자)를 세션 행에 적어둔다.
     *
     * 나중에 오는 logout_token 은 sid 하나만 들고 온다. 로그인 때 미리 적어두지
     * 않으면 어느 세션 행이 그 IdP 세션인지 못 찾아서 유저 세션을 전부 지우게 된다.
     */
    hooks: {
      after: [
        {
          // OIDC 콜백 요청일 때만 이 훅을 켠다.
          matcher: (ctx) =>
            ctx.path?.startsWith(`/callback/${options.providerId}`) ?? false,
          handler: createAuthMiddleware(async (ctx) => {
            // 방금 세션이 새로 생겼나? 아니면 로그인이 아니니 통과.
            const created = ctx.context.newSession;
            if (!created) return;

            // id_token 은 훅에 직접 안 넘어온다. 콜백이 방금 account 행에
            // 써넣었으니 거기서 읽어온다.
            const linked = await ctx.context.adapter.findOne<{
              idToken: string | null;
            }>({
              model: 'account',
              where: [
                { field: 'providerId', value: options.providerId },
                { field: 'userId', value: created.session.userId },
              ],
            });
            if (!linked?.idToken) return;

            // 서명 검증은 콜백이 이미 했다. 여기선 안에서 sid 값만 꺼내면 된다.
            const { sid } = decodeJwt(linked.idToken);
            if (typeof sid !== 'string') return;

            // 방금 만들어진 그 세션 행에 sid 를 기록.
            await ctx.context.internalAdapter.updateSession(
              created.session.token,
              { idpSid: sid },
            );
          }),
        },
      ],
    },
    endpoints: {
      backchannelLogout: createAuthEndpoint(
        '/backchannel-logout',
        {
          method: 'POST',
          // IdP 는 스펙대로 form-urlencoded 로 보낸다.
          metadata: {
            allowedMediaTypes: [
              'application/x-www-form-urlencoded',
              'application/json',
            ],
          },
          body: z.object({ logout_token: z.string() }),
        },
        async (ctx) => {
          let payload: JWTPayload;
          try {
            const verified = await jwtVerify(ctx.body.logout_token, jwks, {
              issuer: options.issuer,
              audience: options.clientId,
            });
            payload = verified.payload;
          } catch (error) {
            ctx.context.logger.warn(
              '[backchannel-logout] logout_token 검증 실패',
              error,
            );
            throw reject();
          }

          // 스펙 필수. 없으면 같은 키로 서명된 id_token 을 들이밀어
          // 임의 유저를 로그아웃시킬 수 있다.
          const events = payload.events as Record<string, unknown> | undefined;
          if (!events || !(BACKCHANNEL_LOGOUT_EVENT in events)) {
            throw reject();
          }
          // nonce 가 있으면 logout_token 이 아니라 id_token 이다.
          if ('nonce' in payload) {
            throw reject();
          }

          const subject = payload.sub;
          if (!subject) {
            throw reject();
          }

          const linked = await ctx.context.internalAdapter.findAccountByKey({
            providerId: options.providerId,
            accountId: subject,
          });

          // 모르는 유저여도 성공으로 답한다. 존재 여부를 흘리지 않기 위해.
          if (linked) {
            const sid = payload.sid;

            if (typeof sid === 'string') {
              // 끝난 IdP 세션에서 파생된 세션만 끊는다. 다른 기기는 살려둔다.
              const sessions = await ctx.context.internalAdapter.listSessions(
                linked.userId,
              );
              await Promise.all(
                sessions
                  // additionalFields 는 플러그인 밖에서 선언돼 base 타입에 안 뜬다.
                  .filter(
                    (s) => (s as { idpSid?: string | null }).idpSid === sid,
                  )
                  .map((s) =>
                    ctx.context.internalAdapter.deleteSession(s.token),
                  ),
              );
            } else {
              // sid 없는 logout_token 도 스펙상 유효하다. 그땐 좁힐 수가 없다.
              await ctx.context.internalAdapter.deleteUserSessions(
                linked.userId,
              );
            }
          }

          ctx.setHeader('Cache-Control', 'no-store');
          return ctx.json({ ok: true });
        },
      ),
    },
  };
};
