import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const submitter = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock("../composition.client", () => ({ scoreSubmitter: submitter }));

const session = vi.hoisted(() => ({ user: null as { id: string; name: string } | null }));
vi.mock("@/modules/auth", () => ({ useSession: () => session }));

import { PlayerScreen } from "./player-screen";

const game = { id: "caida", title: "CAÍDA" };
const score = () => screen.getByTestId("hud-score").textContent;
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0); // +10 puntos por tick (220 ms)
  submitter.submit.mockReset();
  session.user = null;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("PlayerScreen", () => {
  it("sin sesión muestra INVITADO; con sesión, el nombre del usuario", () => {
    const { unmount } = render(<PlayerScreen game={game} />);
    expect(screen.getByText("INVITADO")).toBeInTheDocument();
    unmount();
    session.user = { id: "u1", name: "PX_KAI" };
    render(<PlayerScreen game={game} />);
    expect(screen.getByText("PX_KAI")).toBeInTheDocument();
  });

  it("la puntuación crece sola", () => {
    render(<PlayerScreen game={game} />);
    expect(score()).toBe("0");
    advance(660);
    expect(score()).toBe("30");
  });

  it("PAUSA detiene la puntuación y REANUDAR la retoma", () => {
    render(<PlayerScreen game={game} />);
    advance(440);
    fireEvent.click(screen.getByRole("button", { name: "PAUSA" }));
    const frozen = score();
    advance(2000);
    expect(score()).toBe(frozen);
    expect(screen.getByText("EN PAUSA")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "REANUDAR" }));
    advance(220);
    expect(score()).not.toBe(frozen);
    expect(screen.queryByText("EN PAUSA")).not.toBeInTheDocument();
  });

  it("FIN abre el modal con la puntuación final y detiene el juego", () => {
    render(<PlayerScreen game={game} />);
    advance(440);
    fireEvent.click(screen.getByRole("button", { name: "FIN" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const final = screen.getByTestId("final-score").textContent;
    expect(final).toBe("20");
    advance(2000);
    expect(screen.getByTestId("final-score").textContent).toBe(final);
  });

  it("GUARDAR llama a ScoreSubmitter con { name, score } y muestra el aviso", async () => {
    submitter.submit.mockResolvedValue(undefined);
    render(<PlayerScreen game={game} />);
    advance(440);
    fireEvent.click(screen.getByRole("button", { name: "FIN" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "GUARDAR PUNTUACIÓN" }));
    });
    expect(submitter.submit).toHaveBeenCalledWith("caida", { name: "INVITADO", score: 20 });
    expect(screen.getByText(/PUNTUACIÓN GUARDADA/)).toBeInTheDocument();
  });

  it("permite editar el nombre en mayúsculas (máx. 10) antes de guardar", async () => {
    submitter.submit.mockResolvedValue(undefined);
    render(<PlayerScreen game={game} />);
    advance(220);
    fireEvent.click(screen.getByRole("button", { name: "FIN" }));
    fireEvent.change(screen.getByLabelText("Tus iniciales"), { target: { value: "abcdefghijklmn" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "GUARDAR PUNTUACIÓN" }));
    });
    expect(submitter.submit).toHaveBeenCalledWith("caida", { name: "ABCDEFGHIJ", score: 10 });
  });

  it("si el guardado falla muestra el error y permite reintentar sin perder la puntuación", async () => {
    submitter.submit.mockRejectedValueOnce(new Error("No se pudo conectar con el servidor."));
    submitter.submit.mockResolvedValueOnce(undefined);
    render(<PlayerScreen game={game} />);
    advance(440);
    fireEvent.click(screen.getByRole("button", { name: "FIN" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "GUARDAR PUNTUACIÓN" }));
    });
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo conectar con el servidor.");
    expect(screen.getByTestId("final-score").textContent).toBe("20");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "REINTENTAR" }));
    });
    expect(submitter.submit).toHaveBeenCalledTimes(2);
    expect(submitter.submit).toHaveBeenLastCalledWith("caida", { name: "INVITADO", score: 20 });
    expect(screen.getByText(/PUNTUACIÓN GUARDADA/)).toBeInTheDocument();
  });

  it("JUGAR DE NUEVO reinicia a 0 puntos, 3 vidas, nivel 01", () => {
    render(<PlayerScreen game={game} />);
    advance(440);
    fireEvent.click(screen.getByRole("button", { name: "FIN" }));
    fireEvent.click(screen.getByRole("button", { name: "JUGAR DE NUEVO" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(score()).toBe("0");
    expect(screen.getByText("♥ ♥ ♥")).toBeInTheDocument();
    expect(screen.getByTestId("hud-level").textContent).toBe("01");
  });

  it("SALIR enlaza al detalle del juego", () => {
    render(<PlayerScreen game={game} />);
    expect(screen.getByRole("link", { name: "SALIR" })).toHaveAttribute("href", "/juegos/caida");
  });
});
