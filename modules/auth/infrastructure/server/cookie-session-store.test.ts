import { beforeEach, describe, expect, it, vi } from "vitest";
import { describeSessionStoreContract } from "../../testing/contracts";
import { CookieSessionStore } from "./cookie-session-store";

const jar = vi.hoisted(() => ({
  values: new Map<string, string>(),
  sets: [] as { name: string; value: string; options: unknown }[],
  deletes: [] as string[],
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.values.has(name) ? { name, value: jar.values.get(name) } : undefined,
    set: (name: string, value: string, options: unknown) => {
      jar.values.set(name, value);
      jar.sets.push({ name, value, options });
    },
    delete: (name: string) => {
      jar.values.delete(name);
      jar.deletes.push(name);
    },
  }),
}));

beforeEach(() => {
  jar.values.clear();
  jar.sets.length = 0;
  jar.deletes.length = 0;
});

describeSessionStoreContract("Cookie", () => new CookieSessionStore());

describe("CookieSessionStore", () => {
  it("guarda av_session con httpOnly, SameSite=Lax y path=/", async () => {
    await new CookieSessionStore().start("u1");
    expect(jar.sets).toEqual([
      {
        name: "av_session",
        value: "u1",
        options: { httpOnly: true, sameSite: "lax", path: "/" },
      },
    ]);
  });

  it("end borra la cookie av_session", async () => {
    await new CookieSessionStore().end();
    expect(jar.deletes).toEqual(["av_session"]);
  });
});
