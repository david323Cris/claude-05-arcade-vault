import type { SessionStore } from "../application/ports/session-store";

export class InMemorySessionStore implements SessionStore {
  constructor(private userId: string | null = null) {}

  async getUserId(): Promise<string | null> {
    return this.userId;
  }

  async start(userId: string): Promise<void> {
    this.userId = userId;
  }

  async end(): Promise<void> {
    this.userId = null;
  }
}
