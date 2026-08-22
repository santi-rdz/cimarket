import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";

export type { PrismaClient };

export function createPrisma(databseUrl: string) {
  const adapter = new PrismaNeon({ connectionString: databseUrl });
  return new PrismaClient({ adapter });
}
