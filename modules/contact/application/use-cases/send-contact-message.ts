import {
  validateContactMessage,
  type ContactMessageInput,
  type ContactValidationError,
} from "../../domain/contact-message";
import type { EmailSender } from "../ports/email-sender";

export interface SendContactMessageConfig {
  /** Correo del equipo que recibe los mensajes. */
  to: string;
  from: string;
}

export type SendContactMessageResult =
  | { ok: true }
  | { ok: false; errors: ContactValidationError[] };

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export class SendContactMessage {
  constructor(
    private readonly sender: EmailSender,
    private readonly config: SendContactMessageConfig,
  ) {}

  async execute(input: ContactMessageInput): Promise<SendContactMessageResult> {
    // Honeypot: un bot lo rellenó. Se responde éxito sin enviar nada.
    if (typeof input.website === "string" && input.website.trim() !== "") {
      return { ok: true };
    }

    const result = validateContactMessage(input);
    if (!result.ok) return result;

    const { name, email, message } = result.value;
    await this.sender.send({
      to: this.config.to,
      from: this.config.from,
      replyTo: email,
      subject: `Arcade Vault · Contacto de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`,
      html:
        `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p>` +
        `<p><strong>Correo:</strong> ${escapeHtml(email)}</p>` +
        `<p><strong>Mensaje:</strong></p>` +
        `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    });
    return { ok: true };
  }
}
