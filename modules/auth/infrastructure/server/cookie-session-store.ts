import "server-only";
import { cookies } from "next/headers";
import type { SessionStore } from "../../application/ports/session-store";

export const SESSION_COOKIE = "av_session";

/** Sesión en cookie `httpOnly`. Su valor es el id del usuario, sin firmar (solo mock). */
export class CookieSessionStore implements SessionStore {
  async getUserId(): Promise<string | null> {
    const store = await cookies();
    return store.get(SESSION_COOKIE)?.value || null;
  }

  async start(userId: string): Promise<void> {
    const store = await cookies();
    store.set(SESSION_COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/" });
  }

  async end(): Promise<void> {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
  }
}
