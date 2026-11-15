import type { ContactMessageInput } from "../../domain/contact-message";

export type ContactSubmitResult =
  | { ok: true }
  /** `invalid`: el servidor rechazó los datos (400). `failed`: error de envío, servidor o red. */
  | { ok: false; reason: "invalid" | "failed" };

/** Puerto de cliente: cómo el frontend envía el mensaje de contacto. Nunca lanza. */
export interface ContactGateway {
  submit(input: ContactMessageInput): Promise<ContactSubmitResult>;
}
