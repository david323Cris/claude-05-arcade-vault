import type { Clock } from "@/shared/kernel/clock";
import { NotFoundError } from "@/shared/kernel/errors";
import {
  normalizePlayerName,
  rankScores,
  validateScoreValue,
  type ScoreEntry,
  type StoredScore,
} from "../../domain/score";
import type { GameCatalog } from "../ports/game-catalog";
import type { ScoreRepository } from "../ports/score-repository";

export interface SubmitScoreInput {
  gameId: string;
  name: string;
  score: number;
}

export class SubmitScore {
  constructor(
    private readonly scores: ScoreRepository,
    private readonly catalog: GameCatalog,
    private readonly clock: Clock,
  ) {}

  async execute({ gameId, name, score }: SubmitScoreInput): Promise<ScoreEntry> {
    if (!(await this.catalog.exists(gameId))) {
      throw new NotFoundError("Juego no encontrado.");
    }

    const playerName = normalizePlayerName(name);
    validateScoreValue(score);

    const stored: StoredScore = { name: playerName, score, date: this.clock.today() };
    await this.scores.add(gameId, stored);

    // El rango se calcula al leer. En empates la entrada nueva queda después de las existentes
    // (orden estable), así que se busca la última coincidencia.
    const ranked = rankScores(await this.scores.listByGame(gameId));
    return ranked.findLast(
      (e) => e.name === stored.name && e.score === stored.score && e.date === stored.date,
    )!;
  }
}
