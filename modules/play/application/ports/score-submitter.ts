/** Puerto de cliente: cómo el Reproductor guarda la puntuación final. */
export interface ScoreSubmitter {
  submit(gameId: string, input: { name: string; score: number }): Promise<void>;
}
