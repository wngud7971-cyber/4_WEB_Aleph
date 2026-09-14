// 월 달력 그리드(일요일 시작) 계산. 6주(42칸)로 고정해 레이아웃이 흔들리지 않게 한다.

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function ymd(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function parseYearMonth(yearMonthStr) {
  const [y, m] = (yearMonthStr || "").split("-").map(Number);
  const now = new Date();
  if (!y || !m) return { year: now.getFullYear(), month: now.getMonth() + 1 };
  return { year: y, month: m };
}

export function shiftMonth(year, month, delta) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

// 6주 x 7일 = 42개 셀. 이전/다음 달 날짜도 채우되 inMonth=false로 표시.
export function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startWeekday = firstOfMonth.getDay(); // 0=일요일
  const daysInMonth = new Date(year, month, 0).getDate();
  const { year: py, month: pm } = shiftMonth(year, month, -1);
  const daysInPrevMonth = new Date(py, pm, 0).getDate();

  const cells = [];
  // 이전 달 꼬리
  for (let i = 0; i < startWeekday; i++) {
    const day = daysInPrevMonth - startWeekday + i + 1;
    cells.push({ date: ymd(py, pm, day), day, inMonth: false });
  }
  // 이번 달
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: ymd(year, month, day), day, inMonth: true });
  }
  // 다음 달 머리 (42칸 채우기)
  const { year: ny, month: nm } = shiftMonth(year, month, 1);
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ date: ymd(ny, nm, nextDay), day: nextDay, inMonth: false });
    nextDay++;
  }

  const weeks = [];
  for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
