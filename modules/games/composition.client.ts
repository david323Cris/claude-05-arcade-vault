import type { GamesGateway } from "./application/ports/games-gateway";
import { HttpGamesGateway } from "./infrastructure/client/http-games-gateway";

export const gamesGateway: GamesGateway = new HttpGamesGateway();
