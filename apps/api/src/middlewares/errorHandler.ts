import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { HTTPException } from "hono/http-exception";
import { Prisma } from "../generated/prisma/client.js";
import { AppError, ConflictError, NotFoundError } from "@/lib/AppError";

const MODEL_NAMES_ES: Record<string, string> = {
  User: "Usuario",
  Product: "Producto",
  ProductImage: "Imagen de producto",
  Favorite: "Favorito",
  Category: "Categoría",
  Subcategory: "Subcategoría",
  City: "Ciudad",
  Campus: "Campus",
  Conversation: "Conversación",
  Message: "Mensaje",
  MessageAttachment: "Archivo adjunto",
  Transaction: "Transacción",
  Review: "Reseña",
  Notification: "Notificación",
  PushToken: "Token de notificaciones",
  Report: "Reporte",
  AdminAuditLog: "Registro de auditoría",
  Session: "Sesión",
};

function toSpanishModelName(modelName: string): string {
  return MODEL_NAMES_ES[modelName] ?? "Recurso";
}

// Prisma error codes: https://www.prisma.io/docs/orm/reference/error-reference
function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof HTTPException) {
    return new AppError(err.message, err.status, "HTTP_EXCEPTION");
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = err.meta?.target;
        const field = Array.isArray(target) ? target.join(", ") : String(target ?? "campo");
        return new ConflictError(field);
      }
      case "P2025": {
        const modelName = typeof err.meta?.modelName === "string" ? err.meta.modelName : undefined;
        return new NotFoundError(modelName ? toSpanishModelName(modelName) : "Recurso");
      }
      case "P2003": {
        const field = typeof err.meta?.field_name === "string" ? err.meta.field_name : "campo";
        return new AppError(
          `Referencia inválida para el campo ${field}`,
          409,
          "FOREIGN_KEY_CONSTRAINT",
        );
      }
      default:
        return new AppError(
          "Error en la solicitud a la base de datos",
          500,
          "DATABASE_ERROR",
          false,
        );
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return new AppError("Consulta inválida a la base de datos", 400, "DATABASE_VALIDATION_ERROR");
  }

  return new AppError("Algo salió mal", 500, "INTERNAL_SERVER_ERROR", false);
}

export function errorHandler(err: unknown, c: Context) {
  const error = normalizeError(err);

  if (!error.isOperational) {
    console.error("UNEXPECTED ERROR", err);
  }

  return c.json(
    {
      status: error.statusCode >= 500 ? "error" : "fail",
      code: error.code,
      message: error.isOperational ? error.message : "Algo salió mal",
      ...("details" in error && error.details ? { errors: error.details } : {}),
    },
    error.statusCode as ContentfulStatusCode,
  );
}
