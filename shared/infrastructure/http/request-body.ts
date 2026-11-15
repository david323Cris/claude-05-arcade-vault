import { ValidationError } from "@/shared/kernel/errors";

/** Lee el cuerpo JSON de una petición; si no es un objeto JSON lanza ValidationError. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError("El cuerpo de la petición no es un JSON válido.");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("El cuerpo de la petición no es un JSON válido.");
  }
  return body as Record<string, unknown>;
}

/** Los valores que no son texto se tratan como vacíos (la validación del dominio los rechaza). */
export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
