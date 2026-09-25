/**
 * 스캔 결과 1차 필터.
 *
 * 책 뒷면에는 바코드가 둘 있다 — ISBN 바코드와 부가기호 바코드(5자리).
 * 부가기호를 읽었을 때 서버까지 다녀오지 않고 바로 "다시 찍어주세요"를 띄우기 위한 것이다.
 *
 * 체크디지트 검증 같은 진짜 판단은 서버가 한다. 여기는 UX용 필터일 뿐이다.
 */
export function looksLikeIsbn13(raw: string): boolean {
  return /^97[89]\d{10}$/.test(raw.replace(/[\s-]/g, ''));
}
