import "server-only";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { GetGameScores } from "./application/use-cases/get-game-scores";
import { SubmitScore } from "./application/use-cases/submit-score";
import { GamesModuleCatalog } from "./infrastructure/server/games-module-catalog";
import { JsonScoreRepository } from "./infrastructure/server/json-score-repository";

const scoreRepository = new JsonScoreRepository();
const gameCatalog = new GamesModuleCatalog();

export const getGameScores = new GetGameScores(scoreRepository, gameCatalog);
export const submitScore = new SubmitScore(scoreRepository, gameCatalog, new SystemClock());
