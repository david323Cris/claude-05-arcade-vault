import { describe, expect, it } from "vitest";
import type { CategoryRepository } from "../application/ports/category-repository";
import type { GameRepository } from "../application/ports/game-repository";
import type { Game } from "../domain/game";
import { sampleCategories, sampleGames } from "./fixtures";

type Maybe<T> = T | Promise<T>;

/** Pruebas de contrato: toda implementación de GameRepository debe pasarlas. */
export function describeGameRepositoryContract(
  name: string,
  create: (games: Game[]) => Maybe<GameRepository>,
) {
  describe(`GameRepository contract: ${name}`, () => {
    it("findAll devuelve todos los juegos", async () => {
      const repo = await create(sampleGames);
      expect(await repo.findAll()).toEqual(sampleGames);
    });

    it("findById devuelve el juego existente", async () => {
      const repo = await create(sampleGames);
      expect(await repo.findById("caida")).toEqual(sampleGames[1]);
    });

    it("findById devuelve null si no existe", async () => {
      const repo = await create(sampleGames);
      expect(await repo.findById("xyz")).toBeNull();
    });
  });
}

/** Pruebas de contrato: toda implementación de CategoryRepository debe pasarlas. */
export function describeCategoryRepositoryContract(
  name: string,
  create: (categories: string[]) => Maybe<CategoryRepository>,
) {
  describe(`CategoryRepository contract: ${name}`, () => {
    it("findAll devuelve las categorías en orden", async () => {
      const repo = await create(sampleCategories);
      expect(await repo.findAll()).toEqual(sampleCategories);
    });
  });
}
