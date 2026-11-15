import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const jar = vi.hoisted(() => ({ values: new Map<string, string>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.values.has(name) ? { name, value: jar.values.get(name) } : undefined,
    set: (name: string, value: string) => jar.values.set(name, value),
    delete: (name: string) => jar.values.delete(name),
  }),
}));
// `connection()` solo existe dentro de una petición de Next.
vi.mock("next/server", () => ({ connection: async () => {} }));

let dir: string;

// Copia de data/ en un directorio temporal: los tests nunca escriben en los JSON versionados.
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "av-scores-api-"));
  for (const file of ["games.json", "categories.json", "scores.json", "users.json"]) {
    await fs.copyFile(path.join(process.cwd(), "data", file), path.join(dir, file));
  }
  process.env.DATA_DIR = dir;
  jar.values.clear();
});

afterEach(async () => {
  delete process.env.DATA_DIR;
  await fs.rm(dir, { recursive: true, force: true });
});

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const get = (id: string, query = "") =>
  GET(new Request(`http://x/api/games/${id}/scores${query}`), ctx(id));
const post = (id: string, body: unknown) =>
  POST(
    new Request(`http://x/api/games/${id}/scores`, {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    ctx(id),
  );
const savedScores = async () =>
  JSON.parse(await fs.readFile(path.join(dir, "scores.json"), "utf8")) as Record<
    string,
    { name: string; score: number; date: string }[]
  >;

describe("GET /api/games/[id]/scores", () => {
  it("devuelve 12 entradas ordenadas desc con rank 1..12 y you null sin sesión", async () => {
    const res = await get("bloque-buster");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toHaveLength(12);
    expect(body.entries.map((e: { rank: number }) => e.rank)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
    const scores: number[] = body.entries.map((e: { score: number }) => e.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(body.you).toBeNull();
  });

  it("respeta ?limit=10", async () => {
    const body = await (await get("bloque-buster", "?limit=10")).json();
    expect(body.entries).toHaveLength(10);
  });

  it("404 con { error } si el juego no existe", async () => {
    const res = await get("xyz");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Juego no encontrado." });
  });

  it("con sesión y una marca guardada con ese nombre, you trae su mejor marca y rango", async () => {
    jar.values.set("av_session", "u2"); // PLAYER1
    await post("bloque-buster", { name: "player1", score: 100 });
    await post("bloque-buster", { name: "PLAYER1", score: 999999 });
    const body = await (await get("bloque-buster")).json();
    expect(body.you).toMatchObject({ rank: 1, score: 999999 });
    expect(body.you).toHaveProperty("date");
  });

  it("con sesión pero sin marcas en ese juego, you es null", async () => {
    jar.values.set("av_session", "u2"); // PLAYER1 no está en los datos semilla
    const body = await (await get("bloque-buster")).json();
    expect(body.you).toBeNull();
  });

  it("con sesión y limit, you usa el ranking completo", async () => {
    jar.values.set("av_session", "u2");
    await post("bloque-buster", { name: "PLAYER1", score: 1000 });
    const body = await (await get("bloque-buster", "?limit=1")).json();
    expect(body.entries).toHaveLength(1);
    expect(body.you.rank).toBeGreaterThan(1);
  });
});

describe("POST /api/games/[id]/scores", () => {
  it("name 'ana' score 999999 → 201 con ANA y rank 1, guardado en scores.json y en el GET", async () => {
    const res = await post("bloque-buster", { name: "ana", score: 999999 });
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ name: "ANA", score: 999999, rank: 1 });

    const saved = await savedScores();
    expect(saved["bloque-buster"]).toHaveLength(13);
    expect(saved["bloque-buster"].at(-1)).toMatchObject({ name: "ANA", score: 999999 });
    expect(saved["bloque-buster"].at(-1)).not.toHaveProperty("rank");

    const { entries } = await (await get("bloque-buster")).json();
    expect(entries).toHaveLength(13);
    expect(entries[0]).toMatchObject({ name: "ANA", rank: 1 });
  });

  it("permite invitados (sin sesión) y usa la fecha de hoy DD/MM/YYYY", async () => {
    const res = await post("caida", { name: "guest", score: 5 });
    expect(res.status).toBe(201);
    expect((await res.json()).date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it.each([
    ["score negativo", { name: "ana", score: -5 }],
    ["score decimal", { name: "ana", score: 10.5 }],
    ["score como texto", { name: "ana", score: "100" }],
    ["sin score", { name: "ana" }],
    ["name vacío", { name: "", score: 10 }],
    ["sin name", { score: 10 }],
    ["name de 11 caracteres", { name: "ABCDEFGHIJK", score: 10 }],
    ["cuerpo que no es JSON", "esto no es json"],
  ])("%s → 400 con { error } y sin escribir", async (_label, body) => {
    const before = await fs.readFile(path.join(dir, "scores.json"), "utf8");
    const res = await post("bloque-buster", body);
    expect(res.status).toBe(400);
    expect(await res.json()).toHaveProperty("error");
    expect(await fs.readFile(path.join(dir, "scores.json"), "utf8")).toBe(before);
  });

  it("404 si el juego no existe", async () => {
    const res = await post("xyz", { name: "ana", score: 10 });
    expect(res.status).toBe(404);
    expect(await res.json()).toHaveProperty("error");
  });

  it("dos POST simultáneos conservan ambas entradas", async () => {
    const [a, b] = await Promise.all([
      post("bloque-buster", { name: "uno", score: 400000 }),
      post("bloque-buster", { name: "dos", score: 500000 }),
    ]);
    expect([a.status, b.status]).toEqual([201, 201]);
    const names = (await savedScores())["bloque-buster"].map((s) => s.name);
    expect(names).toContain("UNO");
    expect(names).toContain("DOS");
    expect(names).toHaveLength(14);
  });

  it("muchos POST simultáneos no pierden ninguna entrada", async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, i) => post("rocas", { name: `p${i}`, score: i })),
    );
    expect((await savedScores()).rocas).toHaveLength(12 + 25);
  });
});
