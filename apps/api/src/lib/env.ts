import { z } from 'zod';
import type { Bindings } from '../types/env';

const envSchema = z.object({
  DATABASE_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
});

export function validateEnv(env: Bindings) {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    console.error('Invalid environment variables:\n', z.prettifyError(parsed.error));

    throw new Error('Invalid environment variables', {
      cause: parsed.error,
    });
  }

  return parsed.data;
}
