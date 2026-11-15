import { ValidationError } from "@/shared/kernel/errors";

/** Contraseña en texto plano: solo válido para el mock. */
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
}

/** name = username en MAYÚSCULAS. Nunca incluye la contraseña. */
export interface SessionUser {
  id: string;
  name: string;
}

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;

export function validateUsername(username: string): void {
  if (!USERNAME_PATTERN.test(username)) {
    throw new ValidationError(
      "El usuario debe tener entre 3 y 10 caracteres (letras, números o guion bajo).",
    );
  }
}

export function validateEmail(email: string): void {
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError("El correo electrónico no es válido.");
  }
}

export function validatePassword(password: string): void {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new ValidationError(
      `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    );
  }
}

export function toSessionUser(user: User): SessionUser {
  return { id: user.id, name: user.username.toUpperCase() };
}
