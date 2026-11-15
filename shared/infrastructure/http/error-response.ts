import {
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/shared/kernel/errors";

function statusOf(error: AppError): number {
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ValidationError) return 400;
  if (error instanceof UnauthorizedError) return 401;
  if (error instanceof ConflictError) return 409;
  return 500;
}

/** Único lugar que traduce errores de dominio a HTTP. */
export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    const status = statusOf(error);
    if (status !== 500) return Response.json({ error: error.message }, { status });
  }
  console.error(error);
  return Response.json({ error: "Error interno del servidor." }, { status: 500 });
}
