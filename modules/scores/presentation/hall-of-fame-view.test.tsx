import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScoreEntry } from "../domain/score";

const gateway = vi.hoisted(() => ({ list: vi.fn(), submit: vi.fn() }));
vi.mock("../composition.client", () => ({ scoresGateway: gateway }));

import { HallOfFameView } from "./hall-of-fame-view";

const games = [
  { id: "bloque-buster", title: "BLOQUE BUSTER" },
  { id: "caida", title: "CAÍDA" },
];

const rows = (prefix: string, n = 12): ScoreEntry[] =>
  Array.from({ length: n }, (_, i) => ({
    rank: i + 1,
    name: `${prefix}${i + 1}`,
    score: 100000 - i * 1000,
    date: "01/01/2026",
  }));

beforeEach(() => {
  vi.resetAllMocks();
  gateway.list.mockImplementation(async (id: string) => ({
    entries: rows(id === "caida" ? "CAI" : "BLO"),
    you: null,
  }));
});

describe("HallOfFameView", () => {
  it("pide las 12 primeras del primer juego y muestra podio y tabla", async () => {
    const { container } = render(<HallOfFameView games={games} />);
    expect(await screen.findByText("BLO12")).toBeInTheDocument();
    expect(gateway.list).toHaveBeenCalledWith("bloque-buster", 12);
    expect(container.querySelectorAll(".hall-table .tr")).toHaveLength(12);
    expect(within(container.querySelector(".podium-slot.gold")!).getByText("BLO1")).toBeInTheDocument();
    expect(within(container.querySelector(".podium-slot.silver")!).getByText("BLO2")).toBeInTheDocument();
    expect(within(container.querySelector(".podium-slot.bronze")!).getByText("BLO3")).toBeInTheDocument();
  });

  it("muestra una pestaña por juego", () => {
    render(<HallOfFameView games={games} />);
    expect(screen.getByRole("button", { name: "BLOQUE BUSTER" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CAÍDA" })).toBeInTheDocument();
  });

  it("cambiar de pestaña hace una petición nueva y cambia las filas", async () => {
    render(<HallOfFameView games={games} />);
    expect(await screen.findByText("BLO12")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "CAÍDA" }));
    expect(await screen.findByText("CAI12")).toBeInTheDocument();
    expect(screen.queryByText("BLO12")).not.toBeInTheDocument();
    expect(gateway.list).toHaveBeenCalledTimes(2);
    expect(gateway.list).toHaveBeenLastCalledWith("caida", 12);
  });

  it("muestra error con reintento si la petición falla", async () => {
    gateway.list.mockRejectedValueOnce(new Error("No se pudo conectar con el servidor."));
    render(<HallOfFameView games={games} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo conectar con el servidor.");
    await userEvent.click(screen.getByRole("button", { name: "REINTENTAR" }));
    expect(await screen.findByText("BLO12")).toBeInTheDocument();
    expect(gateway.list).toHaveBeenCalledTimes(2);
  });

  it("sin sesión no muestra TU MEJOR MARCA", async () => {
    render(<HallOfFameView games={games} />);
    await screen.findByText("BLO12");
    expect(screen.queryByText(/TU MEJOR MARCA/)).not.toBeInTheDocument();
  });

  it("con sesión y you muestra la marca del jugador", async () => {
    gateway.list.mockResolvedValue({
      entries: rows("BLO"),
      you: { rank: 7, score: 4321, date: "02/02/2026" },
    });
    const { container } = render(<HallOfFameView games={games} playerName="PX_KAI" />);
    expect(await screen.findByText(/TU MEJOR MARCA EN BLOQUE BUSTER/)).toBeInTheDocument();
    const you = within(container.querySelector(".tr.you")! as HTMLElement);
    expect(you.getByText("PX_KAI")).toBeInTheDocument();
    expect(you.getByText("#07")).toBeInTheDocument();
    expect(you.getByText((4321).toLocaleString("es-ES"))).toBeInTheDocument();
  });

  it("con sesión y you null muestra AÚN SIN MARCA", async () => {
    render(<HallOfFameView games={games} playerName="PX_KAI" />);
    expect(await screen.findByText("AÚN SIN MARCA")).toBeInTheDocument();
  });

  it("cuando la sesión se resuelve vuelve a pedir los datos", async () => {
    const { rerender } = render(<HallOfFameView games={games} />);
    await screen.findByText("BLO12");
    rerender(<HallOfFameView games={games} playerName="PX_KAI" />);
    await waitFor(() => expect(gateway.list).toHaveBeenCalledTimes(2));
  });

  it("el botón de volver enlaza a la Biblioteca", () => {
    render(<HallOfFameView games={games} />);
    expect(screen.getByRole("link", { name: "VOLVER A LA BIBLIOTECA" })).toHaveAttribute("href", "/");
  });
});
