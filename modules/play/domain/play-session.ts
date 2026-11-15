export interface PlaySession {
  score: number;
  lives: number;
  level: number;
  paused: boolean;
  over: boolean;
}

export const INITIAL_LIVES = 3;
const LEVEL_STEP = 2500;
const LEVEL_WINDOW = 100;

export function newSession(): PlaySession {
  return { score: 0, lives: INITIAL_LIVES, level: 1, paused: false, over: false };
}

/**
 * Suma puntos si la partida está activa. Regla de nivel (igual que la plantilla):
 * sube cuando la nueva puntuación cumple score % 2500 < 100.
 */
export function tick(session: PlaySession, points: number): PlaySession {
  if (session.paused || session.over) return session;
  const score = session.score + points;
  const levelUp = score > 0 && score % LEVEL_STEP < LEVEL_WINDOW;
  return { ...session, score, level: levelUp ? session.level + 1 : session.level };
}

export function togglePause(session: PlaySession): PlaySession {
  if (session.over) return session;
  return { ...session, paused: !session.paused };
}

export function end(session: PlaySession): PlaySession {
  return { ...session, over: true };
}
