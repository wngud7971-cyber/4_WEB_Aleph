import { PrismaClient } from "@prisma/client";

// Next.js 개발 모드에서 핫리로드 시 커넥션이 중복 생성되지 않도록 전역에 캐시한다.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
