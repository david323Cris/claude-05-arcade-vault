import { NotFoundError } from "@/shared/kernel/errors";
import { bestOf, rankScores, type ScoreEntry, type YourBest } from "../../domain/score";
import type { GameCatalog } from "../ports/game-catalog";
import type { ScoreRepository } from "../ports/score-repository";

export interface GetGameScoresInput {
  gameId: string;
  /** Entero > 0; cualquier otro valor se ignora. */
  limit?: number;
  playerName?: string;
}

export interface GetGameScoresOutput {
  entries: ScoreEntry[];
  you: YourBest | null;
}

export class GetGameScores {
  constructor(
    private readonly scores: ScoreRepository,
    private readonly catalog: GameCatalog,
  ) {}

  async execute({ gameId, limit, playerName }: GetGameScoresInput): Promise<GetGameScoresOutput> {
    if (!(await this.catalog.exists(gameId))) {
      throw new NotFoundError("Juego no encontrado.");
    }

    const ranked = rankScores(await this.scores.listByGame(gameId));
    const you = playerName ? bestOf(ranked, playerName) : null;
    const entries = Number.isInteger(limit) && limit! > 0 ? ranked.slice(0, limit) : ranked;

    return { entries, you };
  }
}
