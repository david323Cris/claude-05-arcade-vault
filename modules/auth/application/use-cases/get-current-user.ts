import { toSessionUser, type SessionUser } from "../../domain/user";
import type { SessionStore } from "../ports/session-store";
import type { UserRepository } from "../ports/user-repository";

export class GetCurrentUser {
  constructor(
    private readonly users: UserRepository,
    private readonly session: SessionStore,
  ) {}

  /** Usuario de la sesión actual, o null si no hay sesión (o el usuario ya no existe). */
  async execute(): Promise<SessionUser | null> {
    const userId = await this.session.getUserId();
    if (!userId) return null;
    const user = await this.users.findById(userId);
    return user ? toSessionUser(user) : null;
  }
}
