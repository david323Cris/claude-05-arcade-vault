import { describe, expect, it } from "vitest";
import { NotFoundError } from "@/shared/kernel/errors";
import { sampleCategories, sampleGames } from "../../testing/fixtures";
import { InMemoryCategoryRepository } from "../../testing/in-memory-category-repository";
import { InMemoryGameRepository } from "../../testing/in-memory-game-repository";
import { GetGame } from "./get-game";
import { ListCategories } from "./list-categories";
import { ListGames } from "./list-games";

const games = () => new InMemoryGameRepository(sampleGames);

describe("ListGames", () => {
  it("devuelve todos los juegos", async () => {
    expect(await new ListGames(games()).execute()).toEqual(sampleGames);
  });
});

describe("GetGame", () => {
  it("devuelve el juego pedido", async () => {
    expect(await new GetGame(games()).execute("caida")).toEqual(sampleGames[1]);
  });

  it("lanza NotFoundError si no existe", async () => {
    await expect(new GetGame(games()).execute("xyz")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ListCategories", () => {
  it("devuelve las categorías", async () => {
    const useCase = new ListCategories(new InMemoryCategoryRepository(sampleCategories));
    expect(await useCase.execute()).toEqual(sampleCategories);
  });
});
