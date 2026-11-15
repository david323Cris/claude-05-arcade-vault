import { describe, expect, it } from "vitest";
import { CONTACT_LIMITS, validateContactMessage } from "./contact-message";

const valid = { name: "Ana", email: "ana@example.com", message: "Hola equipo" };

describe("validateContactMessage", () => {
  it("acepta valores válidos y los deja con trim", () => {
    const result = validateContactMessage({
      name: "  Ana  ",
      email: "  ana@example.com ",
      message: "  Hola equipo\n",
    });
    expect(result).toEqual({ ok: true, value: valid });
  });

  it("ignora el honeypot en el valor normalizado", () => {
    const result = validateContactMessage({ ...valid, website: "" });
    expect(result).toEqual({ ok: true, value: valid });
  });

  it("campos vacíos o solo espacios → required", () => {
    const result = validateContactMessage({ name: "", email: "   ", message: " \n\t" });
    expect(result).toEqual({
      ok: false,
      errors: [
        { field: "name", reason: "required" },
        { field: "email", reason: "required" },
        { field: "message", reason: "required" },
      ],
    });
  });

  it("valores que no son string cuentan como required", () => {
    const result = validateContactMessage({ name: 5, email: null, message: undefined } as never);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((e) => e.reason)).toEqual(["required", "required", "required"]);
  });

  it.each(["ana", "ana@", "@example.com", "ana@example", "a na@example.com", "ana@@example.com"])(
    "correo sin formato válido (%s) → invalid",
    (email) => {
      expect(validateContactMessage({ ...valid, email })).toEqual({
        ok: false,
        errors: [{ field: "email", reason: "invalid" }],
      });
    },
  );

  it("nombre con salto de línea → invalid", () => {
    expect(validateContactMessage({ ...valid, name: "Ana\nBcc: x@y.com" })).toEqual({
      ok: false,
      errors: [{ field: "name", reason: "invalid" }],
    });
  });

  it("acepta exactamente los límites y rechaza uno más → too_long", () => {
    const email = (n: number) => `${"a".repeat(n - "@b.co".length)}@b.co`;
    expect(
      validateContactMessage({
        name: "n".repeat(CONTACT_LIMITS.name),
        email: email(CONTACT_LIMITS.email),
        message: "m".repeat(CONTACT_LIMITS.message),
      }).ok,
    ).toBe(true);

    expect(
      validateContactMessage({
        name: "n".repeat(CONTACT_LIMITS.name + 1),
        email: email(CONTACT_LIMITS.email + 1),
        message: "m".repeat(CONTACT_LIMITS.message + 1),
      }),
    ).toEqual({
      ok: false,
      errors: [
        { field: "name", reason: "too_long" },
        { field: "email", reason: "too_long" },
        { field: "message", reason: "too_long" },
      ],
    });
  });

  it("el límite se mide tras el trim", () => {
    const name = ` ${"n".repeat(CONTACT_LIMITS.name)} `;
    expect(validateContactMessage({ ...valid, name }).ok).toBe(true);
  });
});
