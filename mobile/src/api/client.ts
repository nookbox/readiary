import Constants from 'expo-constants';

/**
 * 실기기에서는 localhost 가 폰 자신을 가리킨다.
 * Expo 개발 서버가 알려주는 호스트 IP로 바꿔서 맥미니의 API 를 찾아간다.
 */
export function resolveBaseUrl(): string {
  const configured = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? '';
  const fallback = configured || 'http://localhost:4000/api';

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && fallback.includes('localhost')) {
    return fallback.replace('localhost', host);
  }
  return fallback;
}

export const BASE_URL = resolveBaseUrl();

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}
