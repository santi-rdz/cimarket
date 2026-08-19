import { Hono } from 'hono';
import { createPrisma } from './lib/prisma';
import type { Bindings } from './types/env';
import { prismaMiddleware } from './middlewares/prisma';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

type Variables = {
  prisma: ReturnType<typeof createPrisma>;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', logger());
app.use('*', cors());
app.use('/api/*', prismaMiddleware);

app.get('/', (c) => {
  return c.json({
    message: 'CIMarket API',
  });
});
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'cimarket-api',
  });
});
app.get('/api/users', async (c) => {
  const prisma = c.var.prisma;

  const users = await prisma.user.findMany();
  return c.json(users);
});

export default app;
