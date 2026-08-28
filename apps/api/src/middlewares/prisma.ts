import { createMiddleware } from "hono/factory";
import { createPrisma } from "../lib/prisma";
import type { AppEnv } from "@/types/hono";

export const prismaMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const prisma = createPrisma(c.env.DATABASE_URL);

  c.set("prisma", prisma);

  try {
    await next();
  } finally {
    c.executionCtx.waitUntil(prisma.$disconnect());
  }
});
