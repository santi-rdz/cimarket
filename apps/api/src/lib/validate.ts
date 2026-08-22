import { validator } from "hono/validator";
import type { ValidationTargets } from "hono";
import type { ZodType, z } from "zod";
import { ValidationError } from "./AppError";

// Built directly on hono/validator (the primitive @hono/zod-validator itself
// wraps) instead of on top of @hono/zod-validator's Hook type. Its output type
// is inferred from this function's return type, not from a Hook overload, so
// wrapping it in a reusable factory doesn't break c.req.valid() inference.
export const validate = <T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) =>
  validator(target, (value): z.infer<T> => {
    const result = schema.safeParse(value);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      throw new ValidationError("Error de validación", details);
    }
    return result.data;
  });
