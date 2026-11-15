import { describe, expect, it } from "vitest";
import type { ScoreRepository } from "../application/ports/score-repository";
import type { StoredScore } from "../domain/score";
import { sampleScores } from "./fixtures";

type Maybe<T> = T | Promise<T>;

/** Pruebas de contrato: toda implementación de ScoreRepository debe pasarlas. */
export function describeScoreRepositoryContract(
  name: string,
  create: (data: Record<string, StoredScore[]>) => Maybe<ScoreRepository>,
) {
  describe(`ScoreRepository contract: ${name}`, () => {
    it("listByGame devuelve las puntuaciones guardadas del juego", async () => {
      const repo = await create(sampleScores);
      expect(await repo.listByGame("bloque-buster")).toEqual(sampleScores["bloque-buster"]);
    });

    it("listByGame devuelve [] si el juego no tiene puntuaciones", async () => {
      const repo = await create(sampleScores);
      expect(await repo.listByGame("caida")).toEqual([]);
      expect(await repo.listByGame("xyz")).toEqual([]);
      expect(await repo.listByGame("constructor")).toEqual([]);
    });
  });
}
