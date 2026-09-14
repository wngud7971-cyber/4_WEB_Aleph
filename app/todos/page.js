import { prisma } from "@/lib/prisma";
import { kstTodayStr, formatMinutes } from "@/lib/time";
import { completeTodo, uncompleteTodo, deleteTodo } from "@/app/actions";
import OkBanner from "@/app/components/OkBanner";
import ConfirmButton from "@/app/components/ConfirmButton";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = {
  dueDate: "마감일 빠른 순",
  priority: "우선순위 (높음→낮음)",
  estimatedMinutes: "예상 시간 큰 순",
  createdAt: "만든 순 (최신)",
  title: "제목 가나다순",
};

const PRIORITY_RANK = { 최우선: 0, 높음: 1, 보통: 2, 낮음: 3 };

export default async function TodosPage({ searchParams }) {
  const {
    q = "",
    status = "",
    priority = "",
    tag = "",
    planId = "",
    overdue = "",
    blocked = "",
    sort = "createdAt",
  } = searchParams || {};

  const where = { deletedAt: null, ...(planId ? { planId } : {}) };
  if (status) where.status = status;
  if (priority) where.priority = priority;

  let todos = await prisma.todo.findMany({
    where,
    include: { plan: true, executionLogs: true },
  });

  const today = kstTodayStr();

  if (q) {
    const needle = q.toLowerCase();
    todos = todos.filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        (t.content || "").toLowerCase().includes(needle)
    );
  }
  if (tag) {
    todos = todos.filter((t) =>
      t.tags.split(",").map((s) => s.trim()).includes(tag)
    );
  }
  if (overdue === "1") {
    todos = todos.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < today);
  }
  if (blocked === "1") {
    todos = todos.filter((t) =>
      t.executionLogs.some((l) => l.blockerReason && l.blockerReason.trim() !== "")
    );
  }

  // 정렬 - 값이 같을 때는 항상 id로 2차 정렬해서 결과가 매번 달라지지 않게 한다.
  const cmp = {
    dueDate: (a, b) => (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99"),
    priority: (a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9),
    estimatedMinutes: (a, b) => b.estimatedMinutes - a.estimatedMinutes,
    createdAt: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    title: (a, b) => a.title.localeCompare(b.title, "ko"),
  }[sort] || ((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  todos.sort((a, b) => cmp(a, b) || a.id.localeCompare(b.id));

  const plans = await prisma.plan.findMany({ orderBy: { createdAt: "desc" } });

  const qs = (overrides = {}) => {
    const params = new URLSearchParams({
      q, status, priority, tag, planId, overdue, blocked, sort, ...overrides,
    });
    for (const [k, v] of [...params.entries()]) if (!v) params.delete(k);
    return "?" + params.toString();
  };

  return (
    <section className="panel">
      <div className="toolbar" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>할 일</h1>
        <a className="btn" href={`/todos/new${planId ? `?planId=${planId}` : ""}`}>
          + 할 일 추가
        </a>
      </div>
      <OkBanner ok={searchParams?.ok} />

      <div className="toolbar">
        <form method="get">
          <label>
            검색
            <input type="text" name="q" defaultValue={q} placeholder="제목/내용" />
          </label>
          <label>
            계획
            <select name="planId" defaultValue={planId}>
              <option value="">전체</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            상태
            <select name="status" defaultValue={status}>
              <option value="">전체</option>
              <option value="todo">진행 중</option>
              <option value="done">완료</option>
            </select>
          </label>
          <label>
            우선순위
            <select name="priority" defaultValue={priority}>
              <option value="">전체</option>
              <option value="최우선">최우선</option>
              <option value="높음">높음</option>
              <option value="보통">보통</option>
              <option value="낮음">낮음</option>
            </select>
          </label>
          <label>
            태그
            <input type="text" name="tag" defaultValue={tag} placeholder="예: 운동" />
          </label>
          <label>
            정렬 기준
            <select name="sort" defaultValue={sort}>
              {Object.entries(SORT_OPTIONS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">적용</button>
        </form>
      </div>
      <p className="muted">
        지금 정렬 기준: <strong>{SORT_OPTIONS[sort] || SORT_OPTIONS.createdAt}</strong> (값이
        같으면 항상 같은 순서가 되도록 id로 한 번 더 정렬합니다)
        {overdue === "1" && " · 지연만 보기"}
        {blocked === "1" && " · 막힘만 보기"}
      </p>

      {todos.length === 0 ? (
        <p className="muted">조건에 맞는 할 일이 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>제목</th>
              <th>계획</th>
              <th>마감일</th>
              <th>우선순위</th>
              <th>태그</th>
              <th>예상</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {todos.map((t) => {
              const isOverdue = t.status !== "done" && t.dueDate && t.dueDate < today;
              const isBlocked = t.executionLogs.some(
                (l) => l.blockerReason && l.blockerReason.trim() !== ""
              );
              return (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>
                    <a className="link" href={`/plans/${t.planId}`}>
                      {t.plan.title}
                    </a>
                  </td>
                  <td>{t.dueDate || "-"}</td>
                  <td>{t.priority}</td>
                  <td>{t.tags}</td>
                  <td>{formatMinutes(t.estimatedMinutes)}</td>
                  <td>
                    <span className={`badge ${t.status}`}>
                      {t.status === "done" ? "완료" : "진행 중"}
                    </span>{" "}
                    {isOverdue && <span className="badge overdue">지연</span>}{" "}
                    {isBlocked && <span className="badge blocked">막힘</span>}
                  </td>
                  <td className="inline-actions">
                    <a className="link" href={`/todos/${t.id}/edit`}>
                      고치기
                    </a>
                    {t.status === "todo" ? (
                      <form action={completeTodo}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="redirectTo" value={`/todos${qs()}`} />
                        <button type="submit">완료</button>
                      </form>
                    ) : (
                      <form action={uncompleteTodo}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="redirectTo" value={`/todos${qs()}`} />
                        <button type="submit" className="secondary">
                          되돌리기
                        </button>
                      </form>
                    )}
                    <form action={deleteTodo}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="redirectTo" value={`/todos${qs()}`} />
                      <ConfirmButton type="submit" className="danger" message="이 할 일을 지울까요?">
                        지우기
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
