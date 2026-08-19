import { createPrisma } from '../lib/prisma';
import { createMiddleware } from 'hono/factory';

export const prismaMiddleware = createMiddleware(async (c, next) => {
  const prisma = createPrisma(c.env.DATABASE_URL);
  c.set('prisma', prisma);
  await next();
});
