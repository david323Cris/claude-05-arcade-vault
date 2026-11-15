import type { SessionStore } from "../ports/session-store";

export class LogoutUser {
  constructor(private readonly session: SessionStore) {}

  execute(): Promise<void> {
    return this.session.end();
  }
}
