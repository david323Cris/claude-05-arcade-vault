import { describe, expect, it } from "vitest";
import { GET as getCategories } from "../categories/route";
import { GET as getGameById } from "./[id]/route";
import { GET as getGames } from "./route";

// Lectura del data/ versionado (solo lectura; ningún test escribe aquí).
describe("GET /api/games", () => {
  it("devuelve 8 juegos con ids únicos", async () => {
    const res = await getGames();
    expect(res.status).toBe(200);
    const games = (await res.json()) as { id: string }[];
    expect(games).toHaveLength(8);
    expect(new Set(games.map((g) => g.id)).size).toBe(8);
  });
});

describe("GET /api/games/[id]", () => {
  it("devuelve el juego", async () => {
    const res = await getGameById(new Request("http://x/api/games/caida"), {
      params: Promise.resolve({ id: "caida" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: "caida", title: "CAÍDA" });
  });

  it("404 con { error } si el id no existe", async () => {
    const res = await getGameById(new Request("http://x/api/games/xyz"), {
      params: Promise.resolve({ id: "xyz" }),
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Juego no encontrado." });
  });
});

describe("GET /api/categories", () => {
  it("devuelve 5 categorías", async () => {
    const res = await getCategories();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]);
  });
});
