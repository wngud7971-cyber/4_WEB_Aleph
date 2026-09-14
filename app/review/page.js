import { prisma } from "@/lib/prisma";
import { computeReview } from "@/lib/review";
import { formatMinutes, formatKST } from "@/lib/time";
import { createInsight } from "@/app/actions";
import OkBanner from "@/app/components/OkBanner";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ searchParams }) {
  const plans = await prisma.plan.findMany({ orderBy: { createdAt: "desc" } });
  const overall = await computeReview(null);
  const perPlan = await Promise.all(
    plans.map(async (p) => ({ plan: p, review: await computeReview(p.id) }))
  );
  const insights = await prisma.insight.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      // 이름만 표시하기 위해 수동 조회
    },
  });
  const planById = Object.fromEntries(plans.map((p) => [p.id, p]));

  return (
    <>
      <section className="panel">
        <OkBanner ok={searchParams?.ok} />
        <h1>돌아보기</h1>
        <p className="sub">
          숫자를 누르면 그 숫자가 나온 실제 기록으로 이동합니다.
        </p>
        <h2>전체</h2>
        <div className="grid-cards">
          <a className="stat-card" href="/todos">
            <div className="num">{overall.planCount}</div>
            <div className="label">계획 수(할 일 기준)</div>
          </a>
          <a className="stat-card" href="/todos?status=done">
            <div className="num">{overall.doneCount}</div>
            <div className="label">완료 수</div>
          </a>
          <a className="stat-card" href="/todos?overdue=1">
            <div className="num">{overall.overdueCount}</div>
            <div className="label">지연 수</div>
          </a>
          <a className="stat-card" href="/todos?blocked=1">
            <div className="num">{overall.blockedCount}</div>
            <div className="label">막힘 수</div>
          </a>
          <div className="stat-card">
            <div className="num">{formatMinutes(overall.estimatedTotal)}</div>
            <div className="label">예상 시간 합계</div>
          </div>
          <div className="stat-card">
            <div className="num">{formatMinutes(overall.actualTotal)}</div>
            <div className="label">실제 시간 합계</div>
          </div>
          <div className="stat-card">
            <div className="num">
              {overall.diff > 0 ? "+" : ""}
              {formatMinutes(overall.diff)}
            </div>
            <div className="label">차이 (실제-예상)</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>계획별 돌아보기</h2>
        {perPlan.length === 0 ? (
          <p className="muted">아직 계획이 없습니다.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>계획</th>
                <th>할 일 수</th>
                <th>완료</th>
                <th>지연</th>
                <th>막힘</th>
                <th>예상</th>
                <th>실제</th>
                <th>차이</th>
              </tr>
            </thead>
            <tbody>
              {perPlan.map(({ plan, review }) => (
                <tr key={plan.id}>
                  <td>
                    <a className="link" href={`/plans/${plan.id}`}>
                      {plan.title}
                    </a>
                  </td>
                  <td>
                    <a className="link" href={`/todos?planId=${plan.id}`}>
                      {review.planCount}
                    </a>
                  </td>
                  <td>
                    <a className="link" href={`/todos?planId=${plan.id}&status=done`}>
                      {review.doneCount}
                    </a>
                  </td>
                  <td>
                    <a className="link" href={`/todos?planId=${plan.id}&overdue=1`}>
                      {review.overdueCount}
                    </a>
                  </td>
                  <td>
                    <a className="link" href={`/todos?planId=${plan.id}&blocked=1`}>
                      {review.blockedCount}
                    </a>
                  </td>
                  <td>{formatMinutes(review.estimatedTotal)}</td>
                  <td>{formatMinutes(review.actualTotal)}</td>
                  <td>
                    {review.diff > 0 ? "+" : ""}
                    {formatMinutes(review.diff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2>고칠 점 한 줄 → 다음 계획으로</h2>
        <p className="sub">
          이번 돌아보기에서 나온 결론을 한 줄로 적고, 어느 계획을 돌아본 것인지, 그
          결론을 어느 계획(주로 다음 계획)에 반영할지 고릅니다.
        </p>
        {plans.length === 0 ? (
          <p className="muted">계획이 있어야 넘길 수 있습니다.</p>
        ) : (
          <form action={createInsight}>
            <label>
              고칠 점 (한 줄)
              <input
                name="note"
                required
                placeholder="예: 예상 시간을 항상 1.5배로 잡자"
              />
            </label>
            <label>
              이 결론을 반영할 계획 (주로 다음 계획)
              <select name="planId" required>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">다음 계획으로 넘기기</button>
          </form>
        )}
      </section>

      <section className="panel">
        <h2>넘어간 기록 ({insights.length}건)</h2>
        {insights.length === 0 ? (
          <p className="muted">아직 없습니다.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>고칠 점</th>
                <th>반영된 계획</th>
                <th>남긴 시각</th>
              </tr>
            </thead>
            <tbody>
              {insights.map((i) => (
                <tr key={i.id}>
                  <td>{i.note}</td>
                  <td>{i.planId ? planById[i.planId]?.title || "-" : "-"}</td>
                  <td>{formatKST(i.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
