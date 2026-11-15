import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/shared/kernel/errors";
import { errorResponse } from "./error-response";

afterEach(() => vi.restoreAllMocks());

describe("errorResponse", () => {
  it.each([
    [new NotFoundError("No existe."), 404],
    [new ValidationError("Dato inválido."), 400],
    [new UnauthorizedError("No autorizado."), 401],
    [new ConflictError("Ya existe."), 409],
  ])("%s → %i con { error }", async (error, status) => {
    const res = errorResponse(error);
    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error: error.message });
  });

  it("error inesperado → 500 genérico sin detalles internos", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const error of [new Error("secreto interno"), new AppError("secreto"), "texto"]) {
      const res = errorResponse(error);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: "Error interno del servidor." });
    }
  });
});
