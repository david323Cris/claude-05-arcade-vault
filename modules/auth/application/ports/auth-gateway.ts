import type { SessionUser } from "../../domain/user";

/** Puerto de cliente: cómo el frontend maneja la sesión. */
export interface AuthGateway {
  /** null si no hay sesión. */
  me(): Promise<SessionUser | null>;
  login(username: string, password: string): Promise<SessionUser>;
  register(username: string, email: string, password: string): Promise<SessionUser>;
  logout(): Promise<void>;
}
