import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [plans, planRevisions, todos, executionLogs, completionEvents, insights] =
    await Promise.all([
      prisma.plan.findMany(),
      prisma.planRevision.findMany(),
      prisma.todo.findMany(),
      prisma.executionLog.findMany(),
      prisma.completionEvent.findMany(),
      prisma.insight.findMany(),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    plans,
    planRevisions,
    todos,
    executionLogs,
    completionEvents,
    insights,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="plando-diary-export-${Date.now()}.json"`,
    },
  });
}
