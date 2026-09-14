import { prisma } from "@/lib/prisma";
import { createTodo } from "@/app/actions";
import RichTextEditor from "@/app/components/RichTextEditor";

export const dynamic = "force-dynamic";

export default async function NewTodoPage({ searchParams }) {
  const plans = await prisma.plan.findMany({ orderBy: { createdAt: "desc" } });
  const preselect = searchParams?.planId || "";

  return (
    <section className="panel">
      <h1>할 일 추가</h1>
      {plans.length === 0 ? (
        <p className="muted">
          먼저 <a className="link" href="/plans/new">계획을 세워야</a> 할 일을 붙일 수
          있습니다.
        </p>
      ) : (
        <form action={createTodo}>
          <label>
            계획
            <select name="planId" defaultValue={preselect} required>
              <option value="" disabled>
                계획을 고르세요
              </option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            제목
            <input name="title" required placeholder="예: 카드1 계획 스키마 설계" />
          </label>
          <label>
            내용
            <RichTextEditor name="content" defaultValue="" />
          </label>
          <div className="row2">
            <label>
              마감일
              <input type="date" name="dueDate" />
            </label>
            <label>
              예상 시간(분)
              <input type="number" min="0" step="5" name="estimatedMinutes" required />
            </label>
          </div>
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
              태그 (쉼표로 구분)
              <input name="tags" placeholder="예: 백엔드, 카드1" />
            </label>
          </div>
          <button type="submit">할 일 저장</button>
        </form>
      )}
    </section>
  );
}
