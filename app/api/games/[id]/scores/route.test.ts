import { describe, expect, it } from "vitest";
import { GET } from "./route";

// Lectura del data/ versionado (solo lectura).
const call = (id: string, query = "") =>
  GET(new Request(`http://x/api/games/${id}/scores${query}`), {
    params: Promise.resolve({ id }),
  });

describe("GET /api/games/[id]/scores", () => {
  it("devuelve 12 entradas ordenadas desc con rank 1..12 y you null", async () => {
    const res = await call("bloque-buster");
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
    const body = await (await call("bloque-buster", "?limit=10")).json();
    expect(body.entries).toHaveLength(10);
  });

  it("404 con { error } si el juego no existe", async () => {
    const res = await call("xyz");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Juego no encontrado." });
  });
});
