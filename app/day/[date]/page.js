import { prisma } from "@/lib/prisma";
import { formatMinutes } from "@/lib/time";
import OkBanner from "@/app/components/OkBanner";
import ConfirmButton from "@/app/components/ConfirmButton";
import {
  createTodo,
  completeTodo,
  uncompleteTodo,
  deleteTodo,
  createEvent,
  deleteEvent,
} from "@/app/actions";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function shiftDate(dateStr, delta) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default async function DayDetailPage({ params, searchParams }) {
  const { date } = params;
  const weekday = WEEKDAY_LABELS[new Date(date + "T00:00:00").getDay()];

  const [plans, allPlans, todos, events] = await Promise.all([
    prisma.plan.findMany({
      where: { periodStart: { lte: date }, periodEnd: { gte: date } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.todo.findMany({
      where: { deletedAt: null, dueDate: date },
      include: { plan: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.event.findMany({ where: { date }, orderBy: { createdAt: "desc" } }),
  ]);

  const prevDate = shiftDate(date, -1);
  const nextDate = shiftDate(date, 1);
  const [y, m, d] = date.split("-").map(Number);

  return (
    <>
      <section className="panel">
        <div className="cal-header">
          <div className="cal-nav">
            <a className="cal-nav-btn" href={`/day/${prevDate}`}>‹</a>
            <h1>
              {y}년 {m}월 {d}일 ({weekday})
            </h1>
            <a className="cal-nav-btn" href={`/day/${nextDate}`}>›</a>
          </div>
          <a className="link" href={`/?ym=${y}-${String(m).padStart(2, "0")}`}>
            달력으로
          </a>
        </div>
        <OkBanner ok={searchParams?.ok} />
      </section>

      <section className="panel">
        <h2>진행 중인 계획</h2>
        {plans.length === 0 ? (
          <p className="muted">이 날짜를 기간에 포함하는 계획이 없습니다.</p>
        ) : (
          <div className="grid-cards">
            {plans.map((p) => (
              <a className="stat-card" href={`/plans/${p.id}`} key={p.id}>
                <span className="label">
                  {p.title} ({p.periodStart} ~ {p.periodEnd})
                </span>
                <span className="num" style={{ fontSize: 13 }}>{p.priority}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>이날 마감인 할 일 ({todos.length}개)</h2>
        {todos.length === 0 ? (
          <p className="muted">아직 없습니다.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>제목</th>
                <th>계획</th>
                <th>예상</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {todos.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>
                    <a className="link" href={`/plans/${t.planId}`}>{t.plan.title}</a>
                  </td>
                  <td>{formatMinutes(t.estimatedMinutes)}</td>
                  <td>
                    <span className={`badge ${t.status}`}>
                      {t.status === "done" ? "완료" : "진행 중"}
                    </span>
                  </td>
                  <td className="inline-actions">
                    {t.status === "todo" ? (
                      <form action={completeTodo}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="redirectTo" value={`/day/${date}`} />
                        <button type="submit">완료</button>
                      </form>
                    ) : (
                      <form action={uncompleteTodo}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="redirectTo" value={`/day/${date}`} />
                        <button type="submit" className="secondary">되돌리기</button>
                      </form>
                    )}
                    <a className="link" href={`/todos/${t.id}/edit`}>고치기</a>
                    <form action={deleteTodo}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="redirectTo" value={`/day/${date}`} />
                      <ConfirmButton type="submit" className="danger" message="이 할 일을 지울까요?">
                        지우기
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {allPlans.length === 0 ? (
          <p className="muted" style={{ marginTop: 14 }}>
            먼저 <a className="link" href="/plans/new">계획을 만들어야</a> 할 일을 붙일 수 있습니다.
          </p>
        ) : (
          <form action={createTodo} style={{ marginTop: 16 }}>
            <input type="hidden" name="dueDate" value={date} />
            <input type="hidden" name="redirectTo" value={`/day/${date}`} />
            <div className="row2">
              <label>
                계획
                <select name="planId" required defaultValue={allPlans[0]?.id}>
                  {allPlans.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </label>
              <label>
                예상 시간(분)
                <input type="number" min="0" step="5" name="estimatedMinutes" defaultValue={30} required />
              </label>
            </div>
            <label>
              할 일
              <input name="title" required placeholder="이날 할 일" />
            </label>
            <div className="row2">
              <label>
                우선순위
                <select name="priority" defaultValue="보통">
                  <option value="최우선">최우선</option>
                  <option value="높음">높음</option>
                  <option value="보통">보통</option>
                  <option value="낮음">낮음</option>
                </select>
              </label>
              <label>
                태그
                <input name="tags" placeholder="쉼표로 구분" />
              </label>
            </div>
            <button type="submit">이날 할 일 추가</button>
          </form>
        )}
      </section>

      <section className="panel">
        <h2>자유 메모 / 일정 ({events.length}개)</h2>
        <p className="sub">생일, 공휴일처럼 할 일은 아니지만 이 날짜에 남기고 싶은 메모입니다.</p>
        {events.length === 0 ? (
          <p className="muted">아직 없습니다.</p>
        ) : (
          <div className="grid-cards" style={{ marginBottom: 16 }}>
            {events.map((e) => (
              <div className="stat-card" key={e.id}>
                <span className="label">
                  {e.title}
                  {e.note ? ` — ${e.note}` : ""}
                </span>
                <form action={deleteEvent}>
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="date" value={date} />
                  <ConfirmButton type="submit" className="danger" message="이 메모를 지울까요?">
                    지우기
                  </ConfirmButton>
                </form>
              </div>
            ))}
          </div>
        )}
        <form action={createEvent}>
          <input type="hidden" name="date" value={date} />
          <label>
            제목
            <input name="title" required placeholder="예: 생일, 공휴일" />
          </label>
          <label>
            메모 (선택)
            <textarea name="note" placeholder="자세한 내용" />
          </label>
          <button type="submit">메모 추가</button>
        </form>
      </section>
    </>
  );
}
