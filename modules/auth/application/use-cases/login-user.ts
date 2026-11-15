import { UnauthorizedError } from "@/shared/kernel/errors";
import { toSessionUser, type SessionUser } from "../../domain/user";
import type { SessionStore } from "../ports/session-store";
import type { UserRepository } from "../ports/user-repository";

export interface LoginUserInput {
  username: string;
  password: string;
}

export class LoginUser {
  constructor(
    private readonly users: UserRepository,
    private readonly session: SessionStore,
  ) {}

  async execute({ username, password }: LoginUserInput): Promise<SessionUser> {
    const user = await this.users.findByUsername(username);
    // Mismo mensaje para usuario inexistente y contraseña errónea.
    if (!user || user.password !== password) {
      throw new UnauthorizedError("Usuario o contraseña incorrectos.");
    }
    await this.session.start(user.id);
    return toSessionUser(user);
  }
}
