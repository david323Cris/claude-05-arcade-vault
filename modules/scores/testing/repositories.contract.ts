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

    it("add guarda la puntuación sin tocar las demás", async () => {
      const repo = await create(sampleScores);
      const extra = { name: "ANA", score: 1, date: "05/05/2026" };
      await repo.add("bloque-buster", extra);
      expect(await repo.listByGame("bloque-buster")).toEqual([
        ...sampleScores["bloque-buster"],
        extra,
      ]);
      expect(await repo.listByGame("caida")).toEqual([]);
    });

    it("add crea la lista de un juego que aún no tenía puntuaciones", async () => {
      const repo = await create({});
      const extra = { name: "ANA", score: 1, date: "05/05/2026" };
      await repo.add("caida", extra);
      expect(await repo.listByGame("caida")).toEqual([extra]);
    });

    it("add no altera el objeto de datos original", async () => {
      const data = structuredClone(sampleScores);
      const repo = await create(data);
      await repo.add("bloque-buster", { name: "ANA", score: 1, date: "05/05/2026" });
      expect(data).toEqual(sampleScores);
    });
  });
}
