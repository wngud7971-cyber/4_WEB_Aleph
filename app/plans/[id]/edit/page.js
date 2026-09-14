import { prisma } from "@/lib/prisma";
import { updatePlan } from "@/app/actions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditPlanPage({ params }) {
  const plan = await prisma.plan.findUnique({ where: { id: params.id } });
  if (!plan) notFound();

  return (
    <section className="panel">
      <h1>계획 고치기</h1>
      <p className="sub">
        저장하면 지금 값이 "고치기 전 값"으로 수정 이력에 남고, 그 다음 새 값으로
        바뀝니다.
      </p>
      <form action={updatePlan}>
        <input type="hidden" name="id" value={plan.id} />
        <label>
          제목
          <input name="title" defaultValue={plan.title} required />
        </label>
        <div className="row2">
          <label>
            시작일
            <input type="date" name="periodStart" defaultValue={plan.periodStart} required />
          </label>
          <label>
            종료일
            <input type="date" name="periodEnd" defaultValue={plan.periodEnd} required />
          </label>
        </div>
        <label>
          우선순위
          <select name="priority" defaultValue={plan.priority}>
            <option value="최우선">최우선</option>
                  <option value="높음">높음</option>
            <option value="보통">보통</option>
            <option value="낮음">낮음</option>
          </select>
        </label>
        <label>
          성공 기준
          <textarea name="successCriteria" defaultValue={plan.successCriteria} required />
        </label>
        <label>
          예상 시간(시간 단위)
          <input
            type="number"
            step="0.5"
            min="0"
            name="estimatedHours"
            defaultValue={plan.estimatedHours}
            required
          />
        </label>
        <button type="submit">고친 내용 저장</button>
      </form>
    </section>
  );
}
