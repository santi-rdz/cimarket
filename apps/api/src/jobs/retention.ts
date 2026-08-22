import type { PrismaClient } from "@/lib/prisma";

// See schema.prisma model comments on Session and AdminAuditLog — both hold
// PII-adjacent data with no automatic purge. Retention windows below are a
// starting point; adjust to whatever the team actually needs to keep.
const SESSION_RETENTION_DAYS = 30;
const AUDIT_LOG_RETENTION_DAYS = 365;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function runRetentionJob(prisma: PrismaClient) {
  const sessionCutoff = daysAgo(SESSION_RETENTION_DAYS);
  const auditLogCutoff = daysAgo(AUDIT_LOG_RETENTION_DAYS);

  const [sessions, auditLogs] = await Promise.all([
    prisma.session.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: sessionCutoff } }, { revokedAt: { lt: sessionCutoff } }],
      },
    }),
    prisma.adminAuditLog.deleteMany({
      where: { createdAt: { lt: auditLogCutoff } },
    }),
  ]);

  console.log(
    `Retention job: deleted ${sessions.count} session(s), ${auditLogs.count} admin audit log(s)`,
  );
}
