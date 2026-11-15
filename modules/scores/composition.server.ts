import "server-only";
import { GetGameScores } from "./application/use-cases/get-game-scores";
import { GamesModuleCatalog } from "./infrastructure/server/games-module-catalog";
import { JsonScoreRepository } from "./infrastructure/server/json-score-repository";

const scoreRepository = new JsonScoreRepository();
const gameCatalog = new GamesModuleCatalog();

export const getGameScores = new GetGameScores(scoreRepository, gameCatalog);
