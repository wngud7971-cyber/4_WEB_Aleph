import { prisma } from "@/lib/prisma";
import { computeReview } from "@/lib/review";
import { formatKST, formatMinutes } from "@/lib/time";
import { notFound } from "next/navigation";
import OkBanner from "@/app/components/OkBanner";
import ConfirmButton from "@/app/components/ConfirmButton";
import { deletePlan } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function PlanDetailPage({ params, searchParams }) {
  const plan = await prisma.plan.findUnique({
    where: { id: params.id },
    include: {
      revisions: { orderBy: { capturedAt: "desc" } },
      todos: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!plan) notFound();

  const review = await computeReview(plan.id);
  const carriedInsights = await prisma.insight.findMany({
    where: { planId: plan.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <section className="panel">
        <OkBanner ok={searchParams?.ok} />
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <h1 style={{ margin: 0 }}>{plan.title}</h1>
          <div className="inline-actions">
            <a className="btn secondary" href={`/plans/${plan.id}/edit`}>
              계획 고치기
            </a>
            <form action={deletePlan}>
              <input type="hidden" name="id" value={plan.id} />
              <ConfirmButton
                type="submit"
                className="danger"
                message={`"${plan.title}" 계획과 딸린 할 일·실행기록을 모두 지울까요? 되돌릴 수 없습니다.`}
              >
                계획 지우기
              </ConfirmButton>
            </form>
          </div>
        </div>
        <table>
          <tbody>
            <tr>
              <th>기간</th>
              <td>
                {plan.periodStart} ~ {plan.periodEnd}
              </td>
            </tr>
            <tr>
              <th>우선순위</th>
              <td>{plan.priority}</td>
            </tr>
            <tr>
              <th>성공 기준</th>
              <td>{plan.successCriteria}</td>
            </tr>
            <tr>
              <th>예상 시간</th>
              <td>{plan.estimatedHours}시간</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>수정 이력 ({plan.revisions.length}건)</h2>
        {plan.revisions.length === 0 ? (
          <p className="muted">아직 고친 적이 없습니다. 처음 계획 그대로입니다.</p>
        ) : (
          plan.revisions.map((r) => (
            <div className="history-item" key={r.id}>
              <div className="muted">{formatKST(r.capturedAt)} 이전 값</div>
              <div>
                {r.title} · {r.periodStart}~{r.periodEnd} · {r.priority} ·{" "}
                {r.estimatedHours}시간
              </div>
              <div className="muted">성공 기준: {r.successCriteria}</div>
            </div>
          ))
        )}
      </section>

      {carriedInsights.length > 0 && (
        <section className="panel">
          <h2>지난 돌아보기에서 넘어온 메모</h2>
          {carriedInsights.map((i) => (
            <div className="history-item" key={i.id}>
              {i.note}
            </div>
          ))}
        </section>
      )}

      <section className="panel">
        <h2>이 계획의 돌아보기</h2>
        <div className="grid-cards">
          <a className="stat-card" href={`/todos?planId=${plan.id}`}>
            <div className="num">{review.planCount}</div>
            <div className="label">할 일 수</div>
          </a>
          <a className="stat-card" href={`/todos?planId=${plan.id}&status=done`}>
            <div className="num">{review.doneCount}</div>
            <div className="label">완료 수</div>
          </a>
          <a className="stat-card" href={`/todos?planId=${plan.id}&overdue=1`}>
            <div className="num">{review.overdueCount}</div>
            <div className="label">지연 수</div>
          </a>
          <a className="stat-card" href={`/todos?planId=${plan.id}&blocked=1`}>
            <div className="num">{review.blockedCount}</div>
            <div className="label">막힘 수</div>
          </a>
          <div className="stat-card">
            <div className="num">{formatMinutes(review.estimatedTotal)}</div>
            <div className="label">예상 시간 합계</div>
          </div>
          <div className="stat-card">
            <div className="num">{formatMinutes(review.actualTotal)}</div>
            <div className="label">실제 시간 합계</div>
          </div>
          <div className="stat-card">
            <div className="num">
              {review.diff > 0 ? "+" : ""}
              {formatMinutes(review.diff)}
            </div>
            <div className="label">차이 (실제-예상)</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>딸린 할 일 ({plan.todos.length}개)</h2>
          <a className="btn" href={`/todos/new?planId=${plan.id}`}>
            + 할 일 추가
          </a>
        </div>
        {plan.todos.length === 0 ? (
          <p className="muted">아직 할 일이 없습니다. 다섯 개 이상 넣어 보세요.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>제목</th>
                <th>마감일</th>
                <th>우선순위</th>
                <th>태그</th>
                <th>예상</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plan.todos.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.dueDate || "-"}</td>
                  <td>{t.priority}</td>
                  <td>{t.tags}</td>
                  <td>{formatMinutes(t.estimatedMinutes)}</td>
                  <td>
                    <span className={`badge ${t.status}`}>
                      {t.status === "done" ? "완료" : "진행 중"}
                    </span>
                  </td>
                  <td>
                    <a className="link" href={`/todos/${t.id}/edit`}>
                      고치기
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
