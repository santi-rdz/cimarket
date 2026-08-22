export class AppError extends Error {
  public isOperational: boolean;

  constructor(
    message: string,
    public statusCode: number,
    public code: string = "INTERNAL_SERVER_ERROR",
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(field: string) {
    super(`Valor duplicado para el campo ${field}`, 409, "CONFLICT");
  }
}

export type ValidationIssue = { field: string; message: string };

export class ValidationError extends AppError {
  public details: ValidationIssue[];
  constructor(message: string, details: ValidationIssue[], code = "VALIDATION_ERROR") {
    super(message, 400, code);
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No Autorizado") {
    super(message, 401, "UNAUTHORIZED");
  }
}
