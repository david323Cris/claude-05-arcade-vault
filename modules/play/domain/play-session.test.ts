import { describe, expect, it } from "vitest";
import { end, newSession, tick, togglePause } from "./play-session";

describe("play-session", () => {
  it("newSession empieza en 0 puntos, 3 vidas, nivel 1", () => {
    expect(newSession()).toEqual({ score: 0, lives: 3, level: 1, paused: false, over: false });
  });

  it("tick suma puntos y no muta la sesión", () => {
    const s = newSession();
    const next = tick(s, 150);
    expect(next.score).toBe(150);
    expect(s.score).toBe(0);
  });

  it("tick no suma en pausa ni con la partida terminada", () => {
    const paused = togglePause(newSession());
    expect(tick(paused, 50)).toBe(paused);
    const over = end(newSession());
    expect(tick(over, 50)).toBe(over);
  });

  it("el nivel sube cuando score % 2500 < 100 (y score > 0)", () => {
    const s = { ...newSession(), score: 2400 };
    expect(tick(s, 150).level).toBe(2); // 2550 % 2500 = 50
    expect(tick({ ...newSession(), score: 1000 }, 200).level).toBe(1); // 1200
    expect(tick({ ...newSession(), score: 2400 }, 50).level).toBe(1); // 2450
  });

  it("togglePause alterna y no actúa tras el fin", () => {
    const s = newSession();
    expect(togglePause(s).paused).toBe(true);
    expect(togglePause(togglePause(s)).paused).toBe(false);
    const over = end(s);
    expect(togglePause(over)).toBe(over);
  });

  it("end marca la partida como terminada conservando la puntuación", () => {
    const s = tick(newSession(), 500);
    expect(end(s)).toMatchObject({ over: true, score: 500 });
  });
});
