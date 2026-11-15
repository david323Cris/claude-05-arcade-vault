import "server-only";
import { GetGame } from "./application/use-cases/get-game";
import { ListCategories } from "./application/use-cases/list-categories";
import { ListGames } from "./application/use-cases/list-games";
import { JsonCategoryRepository } from "./infrastructure/server/json-category-repository";
import { JsonGameRepository } from "./infrastructure/server/json-game-repository";

const gameRepository = new JsonGameRepository();
const categoryRepository = new JsonCategoryRepository();

export const listGames = new ListGames(gameRepository);
export const getGame = new GetGame(gameRepository);
export const listCategories = new ListCategories(categoryRepository);
