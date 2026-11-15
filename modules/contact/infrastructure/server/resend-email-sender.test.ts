import { beforeEach, describe, expect, it, vi } from "vitest";

const { send, ResendMock } = vi.hoisted(() => {
  const send = vi.fn();
  const ResendMock = vi.fn(function (this: { emails: { send: typeof send } }) {
    this.emails = { send };
  });
  return { send, ResendMock };
});

vi.mock("resend", () => ({ Resend: ResendMock }));

import { ResendEmailSender } from "./resend-email-sender";

const email = {
  to: "team@arcade.test",
  from: "onboarding@resend.dev",
  replyTo: "ana@example.com",
  subject: "Arcade Vault · Contacto de Ana",
  text: "texto",
  html: "<p>html</p>",
};

describe("ResendEmailSender", () => {
  beforeEach(() => {
    send.mockReset();
    ResendMock.mockClear();
  });

  it("crea el cliente con la API key y pasa los campos tal cual", async () => {
    send.mockResolvedValue({ data: { id: "abc" }, error: null });

    await new ResendEmailSender("re_test").send(email);

    expect(ResendMock).toHaveBeenCalledWith("re_test");
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(email);
  });

  it("lanza si Resend devuelve un error", async () => {
    send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "bad from" } });

    await expect(new ResendEmailSender("re_test").send(email)).rejects.toThrow(
      "Resend: validation_error: bad from",
    );
  });

  it("propaga el rechazo si la petición falla (red)", async () => {
    send.mockRejectedValue(new Error("network down"));

    await expect(new ResendEmailSender("re_test").send(email)).rejects.toThrow("network down");
  });
});
