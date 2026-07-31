import 'dotenv/config';
import { z } from 'zod';

const envSchem = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(8000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug']).default('info'),

  DATABASE_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
});

const parsed = envSchem.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:\n', z.prettifyError(parsed.error));
  throw new Error('Invalid environment variables', { cause: parsed.error });
}

export const env = parsed.data;
