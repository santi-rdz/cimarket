import type { Context } from "hono";
import type { createPrisma } from "@/lib/prisma";

export type Variables = {
  prisma: ReturnType<typeof createPrisma>;
};

export type AppEnv = {
  Bindings: Env;
  Variables: Variables;
};

export type AppContext = Context<AppEnv>;
