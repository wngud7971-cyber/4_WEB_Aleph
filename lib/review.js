import { prisma } from "./prisma";
import { kstTodayStr } from "./time";

// 특정 계획(planId) 하나에 대한 돌아보기 집계를 계산한다.
// planId가 없으면 전체(모든 계획) 기준으로 집계한다.
export async function computeReview(planId) {
  const where = { deletedAt: null, ...(planId ? { planId } : {}) };
  const todos = await prisma.todo.findMany({
    where,
    include: { executionLogs: true },
  });

  const today = kstTodayStr();

  const planCount = todos.length; // 그 계획에 딸린, 지우지 않은 할 일 수
  const doneCount = todos.filter((t) => t.status === "done").length;
  const overdueCount = todos.filter(
    (t) => t.status !== "done" && t.dueDate && t.dueDate < today
  ).length; // 완료는 지연으로 중복해서 세지 않는다
  const blockedCount = todos.filter((t) =>
    t.executionLogs.some((l) => l.blockerReason && l.blockerReason.trim() !== "")
  ).length;

  const estimatedTotal = todos.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const actualTotal = todos.reduce(
    (sum, t) => sum + t.executionLogs.reduce((s, l) => s + (l.actualMinutes || 0), 0),
    0
  );
  const diff = actualTotal - estimatedTotal;

  return {
    planId: planId || null,
    planCount,
    doneCount,
    overdueCount,
    blockedCount,
    estimatedTotal,
    actualTotal,
    diff,
    todoIds: todos.map((t) => t.id),
  };
}
