import { prisma } from "@/lib/prisma";
import { formatKST, formatMinutes } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function ExecutionListPage() {
  const logs = await prisma.executionLog.findMany({
    include: { todo: { include: { plan: true } } },
    orderBy: { startedAt: "desc" },
  });

  return (
    <section className="panel">
      <div className="toolbar" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>실행 기록 전체 ({logs.length}건)</h1>
        <a className="btn" href="/execution/new">
          + 실행 기록 남기기
        </a>
      </div>
      {logs.length === 0 ? (
        <p className="muted">아직 실행 기록이 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>할 일</th>
              <th>계획</th>
              <th>시작</th>
              <th>종료</th>
              <th>실제 걸린 시간</th>
              <th>막혔던 이유</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>
                  <a className="link" href={`/todos/${l.todo.id}/edit`}>
                    {l.todo.title}
                  </a>
                </td>
                <td>{l.todo.plan.title}</td>
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
  );
}
