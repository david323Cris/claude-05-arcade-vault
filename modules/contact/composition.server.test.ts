import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { send, ResendMock } = vi.hoisted(() => {
  const send = vi.fn();
  const ResendMock = vi.fn(function (this: { emails: { send: typeof send } }) {
    this.emails = { send };
  });
  return { send, ResendMock };
});

vi.mock("resend", () => ({ Resend: ResendMock }));

import { sendContactMessage } from "./composition.server";

const valid = { name: "Ana", email: "ana@example.com", message: "Hola" };

describe("composition.server sendContactMessage", () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ data: { id: "1" }, error: null });
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_TO_EMAIL", "team@arcade.test");
    vi.stubEnv("CONTACT_FROM_EMAIL", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("usa onboarding@resend.dev como remitente por defecto", async () => {
    await sendContactMessage.execute(valid);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "team@arcade.test", from: "onboarding@resend.dev", replyTo: "ana@example.com" }),
    );
  });

  it("respeta CONTACT_FROM_EMAIL cuando está definida", async () => {
    vi.stubEnv("CONTACT_FROM_EMAIL", "contacto@arcade.test");
    await sendContactMessage.execute(valid);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ from: "contacto@arcade.test" }));
  });

  it.each(["RESEND_API_KEY", "CONTACT_TO_EMAIL"])("falla con un error claro si falta %s", async (name) => {
    vi.stubEnv(name, "");
    await expect(sendContactMessage.execute(valid)).rejects.toThrow(name);
    expect(send).not.toHaveBeenCalled();
  });
});
