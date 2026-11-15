import { describe, expect, it } from "vitest";
import { NotFoundError } from "@/shared/kernel/errors";
import { sampleScores } from "../../testing/fixtures";
import { InMemoryGameCatalog } from "../../testing/in-memory-game-catalog";
import { InMemoryScoreRepository } from "../../testing/in-memory-score-repository";
import { GetGameScores } from "./get-game-scores";

const useCase = () =>
  new GetGameScores(
    new InMemoryScoreRepository(sampleScores),
    new InMemoryGameCatalog(["bloque-buster", "caida"]),
  );

describe("GetGameScores", () => {
  it("devuelve las entradas ordenadas con rangos 1..n y you null", async () => {
    const { entries, you } = await useCase().execute({ gameId: "bloque-buster" });
    expect(entries.map((e) => e.score)).toEqual([9000, 7000, 5000, 3000]);
    expect(entries.map((e) => e.rank)).toEqual([1, 2, 3, 4]);
    expect(you).toBeNull();
  });

  it("respeta limit", async () => {
    const { entries } = await useCase().execute({ gameId: "bloque-buster", limit: 2 });
    expect(entries).toHaveLength(2);
    expect(entries[1].rank).toBe(2);
  });

  it.each([0, -1, 1.5, Number.NaN])("ignora un limit inválido (%s)", async (limit) => {
    const { entries } = await useCase().execute({ gameId: "bloque-buster", limit });
    expect(entries).toHaveLength(4);
  });

  it("you usa el ranking completo aunque limit lo recorte", async () => {
    const { entries, you } = await useCase().execute({
      gameId: "bloque-buster",
      limit: 1,
      playerName: "glitcha",
    });
    expect(entries).toHaveLength(1);
    expect(you).toEqual({ rank: 2, score: 7000, date: "03/01/2026" });
  });

  it("you es null si el jugador no tiene marca", async () => {
    const { you } = await useCase().execute({ gameId: "bloque-buster", playerName: "NADIE" });
    expect(you).toBeNull();
  });

  it("juego sin puntuaciones → entradas vacías", async () => {
    expect(await useCase().execute({ gameId: "caida" })).toEqual({ entries: [], you: null });
  });

  it("lanza NotFoundError si el juego no existe", async () => {
    await expect(useCase().execute({ gameId: "xyz" })).rejects.toBeInstanceOf(NotFoundError);
  });
});
