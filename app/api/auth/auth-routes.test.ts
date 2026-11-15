import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "./login/route";
import { POST as logout } from "./logout/route";
import { GET as me } from "./me/route";
import { POST as register } from "./register/route";

const jar = vi.hoisted(() => ({
  values: new Map<string, string>(),
  sets: [] as { name: string; value: string; options: Record<string, unknown> }[],
  deletes: [] as string[],
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.values.has(name) ? { name, value: jar.values.get(name) } : undefined,
    set: (name: string, value: string, options: Record<string, unknown>) => {
      jar.values.set(name, value);
      jar.sets.push({ name, value, options });
    },
    delete: (name: string) => {
      jar.values.delete(name);
      jar.deletes.push(name);
    },
  }),
}));

// `connection()` solo existe dentro de una petición de Next.
vi.mock("next/server", () => ({ connection: async () => {} }));

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "av-auth-"));
  await fs.copyFile(path.join(process.cwd(), "data", "users.json"), path.join(dir, "users.json"));
  process.env.DATA_DIR = dir;
  jar.values.clear();
  jar.sets.length = 0;
  jar.deletes.length = 0;
});

afterEach(async () => {
  delete process.env.DATA_DIR;
  await fs.rm(dir, { recursive: true, force: true });
});

const post = (body: unknown) =>
  new Request("http://x/api/auth", { method: "POST", body: JSON.stringify(body) });

const readUsers = async () =>
  JSON.parse(await fs.readFile(path.join(dir, "users.json"), "utf8")) as { username: string }[];

describe("POST /api/auth/login", () => {
  it("PX_KAI / vault123 → 200 con cookie av_session httpOnly y sin password", async () => {
    const res = await login(post({ username: "PX_KAI", password: "vault123" }));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ user: { id: "u1", name: "PX_KAI" } });
    expect(text).not.toContain("password");
    expect(jar.sets).toEqual([
      {
        name: "av_session",
        value: "u1",
        options: { httpOnly: true, sameSite: "lax", path: "/" },
      },
    ]);
  });

  it("contraseña incorrecta → 401 con { error } y sin cookie", async () => {
    const res = await login(post({ username: "PX_KAI", password: "mala" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Usuario o contraseña incorrectos." });
    expect(jar.sets).toHaveLength(0);
  });

  it("cuerpo inválido → 400", async () => {
    const res = await login(new Request("http://x", { method: "POST", body: "no-json" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toHaveProperty("error");
  });
});

describe("POST /api/auth/register", () => {
  const valid = { username: "Ana_01", email: "ana@vault.gg", password: "secreto" };

  it("usuario nuevo → 201, se añade a users.json y se establece la cookie", async () => {
    const res = await register(post(valid));
    expect(res.status).toBe(201);
    const text = await res.text();
    const { user } = JSON.parse(text);
    expect(user.name).toBe("ANA_01");
    expect(text).not.toContain("password");
    expect((await readUsers()).map((u) => u.username)).toContain("Ana_01");
    expect(jar.sets).toHaveLength(1);
    expect(jar.sets[0]).toMatchObject({ name: "av_session", value: user.id });
  });

  it("repetirlo con otra capitalización → 409", async () => {
    await register(post(valid));
    const res = await register(post({ ...valid, username: "ANA_01" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toHaveProperty("error");
    expect(await readUsers()).toHaveLength(3);
  });

  it.each([
    ["usuario corto", { username: "ab" }],
    ["correo inválido", { email: "nope" }],
    ["contraseña corta", { password: "123" }],
    ["usuario no es texto", { username: 123 }],
  ])("%s → 400", async (_label, override) => {
    const res = await register(post({ ...valid, ...override }));
    expect(res.status).toBe(400);
    expect(await res.json()).toHaveProperty("error");
    expect(await readUsers()).toHaveLength(2);
  });
});

describe("GET /api/auth/me", () => {
  it("con cookie → 200 con el usuario y sin password", async () => {
    jar.values.set("av_session", "u2");
    const res = await me();
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ user: { id: "u2", name: "PLAYER1" } });
    expect(text).not.toContain("password");
  });

  it("sin cookie → 401", async () => {
    const res = await me();
    expect(res.status).toBe(401);
    expect(await res.json()).toHaveProperty("error");
  });

  it("cookie de un usuario inexistente → 401", async () => {
    jar.values.set("av_session", "ghost");
    expect((await me()).status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("→ 204 y borra la cookie", async () => {
    jar.values.set("av_session", "u1");
    const res = await logout();
    expect(res.status).toBe(204);
    expect(jar.deletes).toEqual(["av_session"]);
    expect(jar.values.has("av_session")).toBe(false);
  });
});
