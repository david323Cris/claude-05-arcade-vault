import { describe, expect, it } from "vitest";
import { InMemoryEmailSender } from "../../testing/in-memory-email-sender";
import { SendContactMessage } from "./send-contact-message";

const config = { to: "team@arcade.test", from: "onboarding@resend.dev" };
const valid = { name: "Ana", email: "ana@example.com", message: "Hola equipo" };

function setup(sender = new InMemoryEmailSender()) {
  return { sender, useCase: new SendContactMessage(sender, config) };
}

describe("SendContactMessage", () => {
  it("envía un correo con to/from/replyTo/subject correctos", async () => {
    const { sender, useCase } = setup();

    expect(await useCase.execute({ ...valid, website: "" })).toEqual({ ok: true });

    expect(sender.sent).toHaveLength(1);
    const [email] = sender.sent;
    expect(email).toMatchObject({
      to: "team@arcade.test",
      from: "onboarding@resend.dev",
      replyTo: "ana@example.com",
      subject: "Arcade Vault · Contacto de Ana",
    });
    expect(email.text).toContain("Ana");
    expect(email.text).toContain("ana@example.com");
    expect(email.text).toContain("Hola equipo");
    expect(email.html).toContain("Hola equipo");
  });

  it("normaliza (trim) antes de armar el correo", async () => {
    const { sender, useCase } = setup();
    await useCase.execute({ name: "  Ana ", email: " ana@example.com ", message: "  Hola  " });
    expect(sender.sent[0].replyTo).toBe("ana@example.com");
    expect(sender.sent[0].subject).toBe("Arcade Vault · Contacto de Ana");
  });

  it("con el honeypot relleno devuelve éxito y no envía", async () => {
    const { sender, useCase } = setup();
    expect(await useCase.execute({ ...valid, website: "http://spam.example" })).toEqual({ ok: true });
    expect(sender.sent).toHaveLength(0);
  });

  it("entrada inválida devuelve los errores y no envía", async () => {
    const { sender, useCase } = setup();
    const result = await useCase.execute({ name: "", email: "nope", message: "Hola" });
    expect(result).toEqual({
      ok: false,
      errors: [
        { field: "name", reason: "required" },
        { field: "email", reason: "invalid" },
      ],
    });
    expect(sender.sent).toHaveLength(0);
  });

  it("si el sender lanza, el error se propaga", async () => {
    const { useCase } = setup(new InMemoryEmailSender(new Error("resend caído")));
    await expect(useCase.execute(valid)).rejects.toThrow("resend caído");
  });

  it("escapa el HTML del visitante", async () => {
    const { sender, useCase } = setup();
    await useCase.execute({
      name: "<b>Ana</b>",
      email: "ana@example.com",
      message: `<script>alert("x")</script> & 'q'`,
    });
    const { html, text } = sender.sent[0];
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>Ana</b>");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;q&#39;");
    expect(html).toContain("&lt;b&gt;Ana&lt;/b&gt;");
    // El texto plano no se escapa.
    expect(text).toContain("<script>");
  });
});
