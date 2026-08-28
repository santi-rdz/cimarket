// With the Neon driver adapter, err.meta.target is undefined for P2002 —
// the real field name(s) live nested under meta.driverAdapterError instead.
export function getConstraintFields(
  meta: Record<string, unknown> | undefined,
): string[] | undefined {
  const driverAdapterError = meta?.driverAdapterError;
  if (typeof driverAdapterError !== "object" || driverAdapterError === null) return undefined;
  const cause = (driverAdapterError as { cause?: unknown }).cause;
  if (typeof cause !== "object" || cause === null) return undefined;
  const fields = (cause as { constraint?: { fields?: unknown } }).constraint?.fields;
  return Array.isArray(fields) ? fields : undefined;
}
