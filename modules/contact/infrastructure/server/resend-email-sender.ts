import { Resend } from "resend";
import type { EmailSender, OutgoingEmail } from "../../application/ports/email-sender";

/** Único archivo del proyecto que importa `resend`. */
export class ResendEmailSender implements EmailSender {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send({ to, from, replyTo, subject, text, html }: OutgoingEmail): Promise<void> {
    // Resend no lanza ante errores de API: los devuelve en `error`.
    const { error } = await this.resend.emails.send({ to, from, replyTo, subject, text, html });
    if (error) {
      throw new Error(`Resend: ${error.name}: ${error.message}`);
    }
  }
}
