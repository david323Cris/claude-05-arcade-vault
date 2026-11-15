import { httpRequest } from "@/shared/infrastructure/http/http-client";
import type { ScoreSubmitter } from "../../application/ports/score-submitter";

export class HttpScoreSubmitter implements ScoreSubmitter {
  async submit(gameId: string, input: { name: string; score: number }): Promise<void> {
    await httpRequest(`/api/games/${encodeURIComponent(gameId)}/scores`, {
      method: "POST",
      body: input,
    });
  }
}
