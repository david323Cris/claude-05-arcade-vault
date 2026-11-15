import type { ScoreSubmitter } from "./application/ports/score-submitter";
import { HttpScoreSubmitter } from "./infrastructure/client/http-score-submitter";

export const scoreSubmitter: ScoreSubmitter = new HttpScoreSubmitter();
