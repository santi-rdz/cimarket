import type { AppContext } from "@/types/hono";
import { createPrisma } from "./prisma";

export async function healthHandler(c: AppContext) {
  if (!c.env.DATABASE_URL) {
    return c.json({ status: "error", service: "cimarket-api", db: "not-configured" }, 503);
  }
  const prisma = createPrisma(c.env.DATABASE_URL);
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: "ok", service: "cimarket-api", db: "ok" });
  } catch (error) {
    console.error("Health check DB ping failed", error);
    return c.json({ status: "error", service: "cimarket-api", db: "error" }, 503);
  } finally {
    await prisma.$disconnect();
  }
}
