import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { send, ResendMock } = vi.hoisted(() => {
  const send = vi.fn();
  const ResendMock = vi.fn(function (this: { emails: { send: typeof send } }) {
    this.emails = { send };
  });
  return { send, ResendMock };
});

vi.mock("resend", () => ({ Resend: ResendMock }));

import { POST } from "./route";

const valid = { name: "Ana", email: "ana@example.com", message: "Hola equipo" };
const post = (body: unknown) =>
  POST(
    new Request("http://x/api/contact", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ data: { id: "1" }, error: null });
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("CONTACT_TO_EMAIL", "team@arcade.test");
  vi.stubEnv("CONTACT_FROM_EMAIL", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/contact", () => {
  it("datos válidos → 201 { ok: true } y un único envío con los campos del contrato", async () => {
    const res = await post({ ...valid, website: "" });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "team@arcade.test",
        from: "onboarding@resend.dev",
        replyTo: "ana@example.com",
        subject: "Arcade Vault · Contacto de Ana",
      }),
    );
  });

  it("usa CONTACT_FROM_EMAIL cuando está definida", async () => {
    vi.stubEnv("CONTACT_FROM_EMAIL", "contacto@arcade.test");
    await post(valid);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ from: "contacto@arcade.test" }));
  });

  it("campos vacíos, correo inválido o textos largos → 400 con fields y sin enviar", async () => {
    const empty = await post({ name: " ", email: "", message: "" });
    expect(empty.status).toBe(400);
    expect(await empty.json()).toEqual({
      error: "invalid",
      fields: [
        { field: "name", reason: "required" },
        { field: "email", reason: "required" },
        { field: "message", reason: "required" },
      ],
    });

    const badEmail = await post({ ...valid, email: "no-es-correo" });
    expect(badEmail.status).toBe(400);
    expect((await badEmail.json()).fields).toEqual([{ field: "email", reason: "invalid" }]);

    const tooLong = await post({ ...valid, message: "x".repeat(2001) });
    expect(tooLong.status).toBe(400);
    expect((await tooLong.json()).fields).toEqual([{ field: "message", reason: "too_long" }]);

    expect(send).not.toHaveBeenCalled();
  });

  it("valores que no son texto → 400", async () => {
    const res = await post({ name: 5, email: ["a@b.co"], message: {} });
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it.each(["{no es json", "[]", "null", '"texto"'])("cuerpo malformado (%s) → 400", async (body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid", fields: [] });
    expect(send).not.toHaveBeenCalled();
  });

  it("honeypot relleno → 201 sin enviar", async () => {
    const res = await post({ ...valid, website: "http://spam.example" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(send).not.toHaveBeenCalled();
  });

  it("Resend devuelve error → 500 send_failed sin detalles internos", async () => {
    send.mockResolvedValue({ data: null, error: { name: "api_error", message: "secreto interno" } });

    const res = await post(valid);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ error: "send_failed" });
    expect(text).not.toContain("secreto");
    expect(console.error).toHaveBeenCalled();
  });

  it("falla de red al enviar → 500 send_failed", async () => {
    send.mockRejectedValue(new Error("ECONNRESET 10.0.0.1"));
    const res = await post(valid);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "send_failed" });
  });

  it.each(["RESEND_API_KEY", "CONTACT_TO_EMAIL"])("falta %s → 500 send_failed", async (name) => {
    vi.stubEnv(name, "");
    const res = await post(valid);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "send_failed" });
    expect(send).not.toHaveBeenCalled();
  });
});
