import "server-only";
import {
  SendContactMessage,
  type SendContactMessageResult,
} from "./application/use-cases/send-contact-message";
import type { ContactMessageInput } from "./domain/contact-message";
import { ResendEmailSender } from "./infrastructure/server/resend-email-sender";

export const DEFAULT_FROM_EMAIL = "onboarding@resend.dev";

function requireEnv(name: "RESEND_API_KEY" | "CONTACT_TO_EMAIL"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

/** Lee las variables en cada llamada: faltar una no rompe la carga del módulo, solo el envío. */
export function createSendContactMessage(): SendContactMessage {
  const apiKey = requireEnv("RESEND_API_KEY");
  const to = requireEnv("CONTACT_TO_EMAIL");
  const from = process.env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  return new SendContactMessage(new ResendEmailSender(apiKey), { to, from });
}

export const sendContactMessage = {
  execute(input: ContactMessageInput): Promise<SendContactMessageResult> {
    return Promise.resolve().then(() => createSendContactMessage().execute(input));
  },
};
