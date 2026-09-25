/**
 * ISBN 정규화 / 검증.
 *
 * 책 뒷면에는 바코드가 둘 있다 — ISBN 바코드와 부가기호 바코드(5자리).
 * 스캐너가 부가기호를 먼저 읽는 일이 잦으므로,
 * 13자리이면서 978/979 로 시작하는 값만 책으로 인정한다.
 *
 * 앱에도 같은 성격의 1차 필터가 있지만 그쪽은 UX용이다.
 * 클라이언트는 믿지 않고 여기서 다시 검증한다.
 */

/** 하이픈·공백 제거 후 대문자화. */
export function normalizeIsbn(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}

/** ISBN-13 형식 + 체크디지트 검증. */
export function isValidIsbn13(raw: string): boolean {
  const isbn = normalizeIsbn(raw);
  if (!/^97[89]\d{10}$/.test(isbn)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(isbn[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(isbn[12]);
}

/** ISBN-10 → ISBN-13 변환. 이미 13자리면 그대로 돌려준다. */
export function toIsbn13(raw: string): string | null {
  const isbn = normalizeIsbn(raw);
  if (isValidIsbn13(isbn)) return isbn;
  if (!/^\d{9}[\dX]$/.test(isbn)) return null;

  const body = `978${isbn.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return `${body}${check}`;
}
