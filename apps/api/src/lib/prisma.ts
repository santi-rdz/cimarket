import { PrismaClient } from '../generated/prisma/client.js';
import { env } from './env.js';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = `${env.DATABASE_URL}`;

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
