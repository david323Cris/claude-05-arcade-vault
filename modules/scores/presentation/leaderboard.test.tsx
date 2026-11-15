import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ScoreEntry } from "../domain/score";
import { Leaderboard } from "./leaderboard";

const entries: ScoreEntry[] = [
  { rank: 1, name: "PX_KAI", score: 28450, date: "01/01/2026" },
  { rank: 2, name: "NOVA", score: 1200, date: "02/01/2026" },
];

describe("Leaderboard", () => {
  it("muestra rangos con cero a la izquierda en el orden recibido", () => {
    const { container } = render(<Leaderboard entries={entries} />);
    expect(Array.from(container.querySelectorAll(".rk")).map((e) => e.textContent)).toEqual(["#01", "#02"]);
    expect(container.querySelector(".lb-row.top1")).toHaveTextContent("PX_KAI");
  });

  it("formatea la puntuación en es-ES", () => {
    render(<Leaderboard entries={entries} />);
    expect(screen.getByText((28450).toLocaleString("es-ES"))).toBeInTheDocument();
  });

  it("sin entradas muestra un mensaje", () => {
    render(<Leaderboard entries={[]} />);
    expect(screen.getByText("Aún no hay puntuaciones.")).toBeInTheDocument();
  });
});
