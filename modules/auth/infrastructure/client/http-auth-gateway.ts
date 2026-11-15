import { ApiError, httpRequest } from "@/shared/infrastructure/http/http-client";
import type { AuthGateway } from "../../application/ports/auth-gateway";
import type { SessionUser } from "../../domain/user";

export class HttpAuthGateway implements AuthGateway {
  async me(): Promise<SessionUser | null> {
    try {
      const { user } = await httpRequest<{ user: SessionUser }>("/api/auth/me");
      return user;
    } catch (error) {
      // 401 = no hay sesión: no es un fallo para quien consulta.
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  }

  async login(username: string, password: string): Promise<SessionUser> {
    const { user } = await httpRequest<{ user: SessionUser }>("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
    return user;
  }

  async register(username: string, email: string, password: string): Promise<SessionUser> {
    const { user } = await httpRequest<{ user: SessionUser }>("/api/auth/register", {
      method: "POST",
      body: { username, email, password },
    });
    return user;
  }

  async logout(): Promise<void> {
    await httpRequest<void>("/api/auth/logout", { method: "POST" });
  }
}
