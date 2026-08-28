import type { AppContext } from "@/types/hono";
import { NotFoundError } from "./AppError";

export function notFoundHandler(_c: AppContext): never {
  throw new NotFoundError("Recurso");
}
