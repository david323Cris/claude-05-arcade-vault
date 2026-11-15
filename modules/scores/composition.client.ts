import type { ScoresGateway } from "./application/ports/scores-gateway";
import { HttpScoresGateway } from "./infrastructure/client/http-scores-gateway";

export const scoresGateway: ScoresGateway = new HttpScoresGateway();
