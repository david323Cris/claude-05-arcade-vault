import type { IdGenerator } from "@/shared/kernel/id-generator";
import { ConflictError } from "@/shared/kernel/errors";
import {
  toSessionUser,
  validateEmail,
  validatePassword,
  validateUsername,
  type SessionUser,
} from "../../domain/user";
import type { SessionStore } from "../ports/session-store";
import type { UserRepository } from "../ports/user-repository";

export interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
}

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly session: SessionStore,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ username, email, password }: RegisterUserInput): Promise<SessionUser> {
    validateUsername(username);
    validateEmail(email);
    validatePassword(password);

    if (await this.users.findByUsername(username)) {
      throw new ConflictError("Ese usuario ya existe.");
    }

    const user = { id: this.ids.next(), username, email, password };
    await this.users.add(user);
    await this.session.start(user.id);
    return toSessionUser(user);
  }
}
