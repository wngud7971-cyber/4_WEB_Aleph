import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatKST, formatMinutes } from "@/lib/time";
import OkBanner from "@/app/components/OkBanner";
import ConfirmButton from "@/app/components/ConfirmButton";
import RichTextEditor from "@/app/components/RichTextEditor";
import {
  updateTodo,
  deleteTodo,
  completeTodo,
  uncompleteTodo,
} from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function EditTodoPage({ params, searchParams }) {
  const todo = await prisma.todo.findUnique({
    where: { id: params.id },
    include: { plan: true, executionLogs: { orderBy: { startedAt: "desc" } } },
  });
  if (!todo) notFound();

  return (
    <>
      <section className="panel">
        <OkBanner ok={searchParams?.ok} />
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <h1 style={{ margin: 0 }}>할 일 고치기</h1>
          <span className={`badge ${todo.status}`}>
            {todo.status === "done" ? "완료" : "진행 중"}
          </span>
        </div>
        <p className="muted">
          계획: <a className="link" href={`/plans/${todo.planId}`}>{todo.plan.title}</a>
        </p>
        <form action={updateTodo}>
          <input type="hidden" name="id" value={todo.id} />
          <label>
            제목
            <input name="title" defaultValue={todo.title} required />
          </label>
          <label>
            내용
            <RichTextEditor name="content" defaultValue={todo.content || ""} />
          </label>
          <div className="row2">
            <label>
              마감일
              <input type="date" name="dueDate" defaultValue={todo.dueDate || ""} />
            </label>
            <label>
              예상 시간(분)
              <input
                type="number"
                min="0"
                step="5"
                name="estimatedMinutes"
                defaultValue={todo.estimatedMinutes}
                required
              />
            </label>
          </div>
          <div className="row2">
            <label>
              우선순위
              <select name="priority" defaultValue={todo.priority}>
                <option value="최우선">최우선</option>
                  <option value="높음">높음</option>
                <option value="보통">보통</option>
                <option value="낮음">낮음</option>
              </select>
            </label>
            <label>
              태그 (쉼표로 구분)
              <input name="tags" defaultValue={todo.tags} />
            </label>
          </div>
          <button type="submit">고친 내용 저장</button>
        </form>

        <div className="inline-actions" style={{ marginTop: 16 }}>
          {todo.status === "todo" ? (
            <form action={completeTodo}>
              <input type="hidden" name="id" value={todo.id} />
              <input type="hidden" name="redirectTo" value={`/todos/${todo.id}/edit`} />
              <button type="submit">완료로 바꾸기</button>
            </form>
          ) : (
            <form action={uncompleteTodo}>
              <input type="hidden" name="id" value={todo.id} />
              <input type="hidden" name="redirectTo" value={`/todos/${todo.id}/edit`} />
              <button type="submit" className="secondary">
                진행 중으로 되돌리기
              </button>
            </form>
          )}
          <form action={deleteTodo}>
            <input type="hidden" name="id" value={todo.id} />
            <ConfirmButton type="submit" className="danger" message="이 할 일을 지울까요?">
              지우기
            </ConfirmButton>
          </form>
        </div>
      </section>

      <section className="panel">
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>실행 기록 ({todo.executionLogs.length}건)</h2>
          <a className="btn secondary" href={`/execution/new?todoId=${todo.id}`}>
            + 실행 기록 남기기
          </a>
        </div>
        {todo.executionLogs.length === 0 ? (
          <p className="muted">아직 실행 기록이 없습니다.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>시작</th>
                <th>종료</th>
                <th>실제 걸린 시간</th>
                <th>막혔던 이유</th>
              </tr>
            </thead>
            <tbody>
              {todo.executionLogs.map((l) => (
                <tr key={l.id}>
                  <td>{formatKST(l.startedAt)}</td>
                  <td>{formatKST(l.endedAt)}</td>
                  <td>{formatMinutes(l.actualMinutes)}</td>
                  <td>{l.blockerReason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
