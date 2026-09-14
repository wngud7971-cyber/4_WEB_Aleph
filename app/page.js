import { prisma } from "@/lib/prisma";
import { buildMonthGrid, parseYearMonth, shiftMonth, WEEKDAY_LABELS } from "@/lib/calendar";
import { kstTodayStr } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function CalendarHomePage({ searchParams }) {
  const { year, month } = parseYearMonth(searchParams?.ym);
  const weeks = buildMonthGrid(year, month);
  const rangeStart = weeks[0][0].date;
  const rangeEnd = weeks[5][6].date;
  const today = kstTodayStr();

  const [todos, plans, events] = await Promise.all([
    prisma.todo.findMany({
      where: { deletedAt: null, dueDate: { gte: rangeStart, lte: rangeEnd } },
      include: { plan: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.plan.findMany({
      where: { periodStart: { lte: rangeEnd }, periodEnd: { gte: rangeStart } },
    }),
    prisma.event.findMany({
      where: { date: { gte: rangeStart, lte: rangeEnd } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const dayMap = {};
  const ensure = (d) => (dayMap[d] ||= { todos: [], events: [], plans: [] });
  for (const t of todos) ensure(t.dueDate).todos.push(t);
  for (const e of events) ensure(e.date).events.push(e);
  for (const p of plans) {
    for (const week of weeks) {
      for (const cell of week) {
        if (cell.date >= p.periodStart && cell.date <= p.periodEnd) {
          ensure(cell.date).plans.push(p);
        }
      }
    }
  }

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const monthLabel = `${year}년 ${month}월`;
  const PRIORITY_RANK = { 최우선: 0, 높음: 1, 보통: 2, 낮음: 3 };

  return (
    <section className="panel calendar-panel">
      <div className="cal-header">
        <div className="cal-nav">
          <a className="cal-nav-btn" href={`/?ym=${prev.year}-${String(prev.month).padStart(2, "0")}`}>
            ‹
          </a>
          <h1>{monthLabel}</h1>
          <a className="cal-nav-btn" href={`/?ym=${next.year}-${String(next.month).padStart(2, "0")}`}>
            ›
          </a>
        </div>
        <div className="inline-actions">
          <a className="btn" href="/plans/new">+ 계획</a>
          <a className="btn secondary" href="/review">돌아보기</a>
        </div>
      </div>

      <div className="cal-grid cal-weekday-row">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={w} className={`cal-weekday ${i === 0 ? "sun" : ""} ${i === 6 ? "sat" : ""}`}>
            {w}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div className="cal-grid" key={wi}>
          {week.map((cell) => {
            const data = dayMap[cell.date] || { todos: [], events: [], plans: [] };
            const isToday = cell.date === today;
            const dayNum = Number(cell.date.slice(-2));

            // 이 날의 모든 항목을 한 줄로 모으되, 우선순위 높은 할 일을 맨 앞에 둔다.
            const sortedTodos = [...data.todos].sort(
              (a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)
            );
            const allItems = [
              ...sortedTodos.map((t) => ({ kind: "todo", obj: t })),
              ...data.events.map((e) => ({ kind: "event", obj: e })),
              ...data.plans.map((p) => ({ kind: "plan", obj: p })),
            ];
            const shown = allItems.slice(0, 2);
            const restCount = allItems.length - shown.length;

            return (
              <a
                key={cell.date}
                href={`/day/${cell.date}`}
                className={`cal-cell ${cell.inMonth ? "" : "cal-cell-out"} ${isToday ? "cal-cell-today" : ""}`}
              >
                <div className="cal-cell-num">{dayNum}</div>
                <div className="cal-cell-body">
                  {shown.map((item) => {
                    if (item.kind === "todo") {
                      const t = item.obj;
                      return (
                        <div
                          key={`t-${t.id}`}
                          className={`cal-chip cal-chip-todo ${t.status === "done" ? "cal-chip-done" : ""}`}
                          title={t.title}
                        >
                          {t.status === "done" ? "✓ " : ""}
                          {t.title}
                        </div>
                      );
                    }
                    if (item.kind === "event") {
                      return (
                        <div key={`e-${item.obj.id}`} className="cal-chip cal-chip-event" title={item.obj.title}>
                          {item.obj.title}
                        </div>
                      );
                    }
                    return (
                      <div key={`p-${item.obj.id}`} className="cal-chip cal-chip-plan" title={item.obj.title}>
                        {item.obj.title}
                      </div>
                    );
                  })}
                  {restCount > 0 && <div className="cal-chip-more">+{restCount}개 더</div>}
                </div>
              </a>
            );
          })}
        </div>
      ))}
    </section>
  );
}
