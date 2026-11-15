import { httpRequest } from "@/shared/infrastructure/http/http-client";
import type { ScoresGateway } from "../../application/ports/scores-gateway";
import type { ScoreEntry, YourBest } from "../../domain/score";

export class HttpScoresGateway implements ScoresGateway {
  list(gameId: string, limit?: number): Promise<{ entries: ScoreEntry[]; you: YourBest | null }> {
    const query = limit === undefined ? "" : `?limit=${encodeURIComponent(String(limit))}`;
    return httpRequest(`/api/games/${encodeURIComponent(gameId)}/scores${query}`);
  }

  submit(gameId: string, input: { name: string; score: number }): Promise<ScoreEntry> {
    return httpRequest<ScoreEntry>(`/api/games/${encodeURIComponent(gameId)}/scores`, {
      method: "POST",
      body: input,
    });
  }
}
