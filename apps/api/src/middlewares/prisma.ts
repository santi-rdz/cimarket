import { createMiddleware } from 'hono/factory';
import { createPrisma } from '../lib/prisma';

export const prismaMiddleware = createMiddleware(async (c, next) => {
  const prisma = createPrisma(c.env.DATABASE_URL);

  c.set('prisma', prisma);

  try {
    await next();
  } finally {
    c.executionCtx.waitUntil(prisma.$disconnect());
  }
});
