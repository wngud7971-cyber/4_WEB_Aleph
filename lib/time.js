// 모든 "오늘 날짜" 판정은 서울 시간(Asia/Seoul) 기준으로 한다.
// 날짜는 항상 "YYYY-MM-DD" 문자열로 다뤄서 시간대 계산 실수를 피한다.

const KST_DATE_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const KST_DATETIME_FMT = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  dateStyle: "medium",
  timeStyle: "short",
});

// 오늘 날짜(서울 기준) "YYYY-MM-DD"
export function kstTodayStr(now = new Date()) {
  return KST_DATE_FMT.format(now);
}

// DateTime -> "YYYY.MM.DD HH:mm" (서울 기준, 화면 표시용)
export function formatKST(dateLike) {
  if (!dateLike) return "-";
  return KST_DATETIME_FMT.format(new Date(dateLike));
}

// 분(minutes) -> "1시간 30분" 같은 표시
export function formatMinutes(min) {
  if (min === null || min === undefined) return "-";
  const m = Math.round(min);
  const h = Math.floor(Math.abs(m) / 60);
  const rem = Math.abs(m) % 60;
  const sign = m < 0 ? "-" : "";
  if (h === 0) return `${sign}${rem}분`;
  if (rem === 0) return `${sign}${h}시간`;
  return `${sign}${h}시간 ${rem}분`;
}
