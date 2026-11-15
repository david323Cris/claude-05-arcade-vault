import "server-only";
import { readJson, updateJson } from "@/shared/infrastructure/json-store";
import type { ScoreRepository } from "../../application/ports/score-repository";
import type { StoredScore } from "../../domain/score";

type ScoresFile = Record<string, StoredScore[]>;

export class JsonScoreRepository implements ScoreRepository {
  async listByGame(gameId: string): Promise<StoredScore[]> {
    const file = await readJson<ScoresFile>("scores.json");
    return Object.hasOwn(file, gameId) ? file[gameId] : [];
  }

  async add(gameId: string, score: StoredScore): Promise<void> {
    await updateJson<ScoresFile>("scores.json", (file) => {
      const current = Object.hasOwn(file, gameId) ? file[gameId] : [];
      return { ...file, [gameId]: [...current, score] };
    });
  }
}
