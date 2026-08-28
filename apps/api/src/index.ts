import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prismaMiddleware } from "./middlewares/prisma";
import { errorHandler } from "./middlewares/errorHandler";
import userRouter from "./routes/userRoutes";
import { createPrisma } from "./lib/prisma";
import { runRetentionJob } from "./jobs/retention";
import type { AppEnv } from "@/types/hono";
import { healthHandler } from "./lib/health";
import { notFoundHandler } from "./lib/notFound";
import { secureHeaders } from "hono/secure-headers";

const app = new Hono<AppEnv>()
  .use("*", logger())
  .use("*", cors({ origin: ["http://localhost:3000", "https://app.cimarket.app"] }))
  .use("*", secureHeaders({ crossOriginResourcePolicy: "same-site" }))
  .use("/api/*", prismaMiddleware)
  .route("/api/v1/users", userRouter)
  .get("/health", healthHandler)
  .notFound(notFoundHandler)
  .onError(errorHandler);

export type AppType = typeof app;

export default {
  fetch: app.fetch,
  async scheduled(_controller, env, ctx) {
    if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    const prisma = createPrisma(env.DATABASE_URL);
    ctx.waitUntil(
      runRetentionJob(prisma)
        .catch((err: unknown) => console.error("Retention job failed", err))
        .finally(() => prisma.$disconnect()),
    );
  },
} satisfies ExportedHandler<Env>;
