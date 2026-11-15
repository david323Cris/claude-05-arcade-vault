/** Datos crudos del formulario. `website` es el honeypot: los usuarios reales nunca lo rellenan. */
export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
  website?: string;
}

/** Mensaje ya validado y normalizado (trim). */
export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

export type ContactField = "name" | "email" | "message";

export interface ContactValidationError {
  field: ContactField;
  reason: "required" | "invalid" | "too_long";
}

export type ContactValidationResult =
  | { ok: true; value: ContactMessage }
  | { ok: false; errors: ContactValidationError[] };

export const CONTACT_LIMITS = { name: 80, email: 254, message: 2000 } as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Saltos de línea y caracteres de control: el nombre va en el asunto del correo.
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function asTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Valida y normaliza el mensaje de contacto. Devuelve todos los errores a la vez. */
export function validateContactMessage(input: ContactMessageInput): ContactValidationResult {
  const name = asTrimmed(input.name);
  const email = asTrimmed(input.email);
  const message = asTrimmed(input.message);
  const errors: ContactValidationError[] = [];

  if (!name) errors.push({ field: "name", reason: "required" });
  else if (name.length > CONTACT_LIMITS.name) errors.push({ field: "name", reason: "too_long" });
  else if (CONTROL_CHARS.test(name)) errors.push({ field: "name", reason: "invalid" });

  if (!email) errors.push({ field: "email", reason: "required" });
  else if (email.length > CONTACT_LIMITS.email) errors.push({ field: "email", reason: "too_long" });
  else if (!EMAIL_PATTERN.test(email)) errors.push({ field: "email", reason: "invalid" });

  if (!message) errors.push({ field: "message", reason: "required" });
  else if (message.length > CONTACT_LIMITS.message) errors.push({ field: "message", reason: "too_long" });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { name, email, message } };
}
