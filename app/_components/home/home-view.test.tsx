import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Game } from "@/modules/games";
import { HomeView } from "./home-view";

const makeGame = (n: number): Game => ({
  id: `juego-${n}`,
  title: `JUEGO ${n}`,
  short: "corto",
  long: "largo",
  cat: "ARCADE",
  cover: "cover-bricks",
  color: "cyan",
  best: 1000 * n,
  plays: "1K",
});
const games = Array.from({ length: 8 }, (_, i) => makeGame(i + 1));

const hrefOf = (name: string | RegExp, scope: HTMLElement | Document = document) => {
  const links = within(scope as HTMLElement).getAllByRole("link", { name });
  return links.map((l) => l.getAttribute("href"));
};

describe("HomeView", () => {
  it("muestra las secciones de la plantilla", () => {
    render(<HomeView games={games} error={null} />);
    for (const title of [
      "¿POR QUÉ ARCADE VAULT?",
      "JUEGOS DISPONIBLES AHORA",
      "ACTIVIDAD EN VIVO",
      "PRECIOS",
      "¿LISTO PARA JUGAR?",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    const h1 = screen.getByRole("heading", { level: 1 });
    for (const line of ["EL ARCADE", "CLÁSICO ESTÁ", "DE VUELTA"]) expect(h1).toHaveTextContent(line);
    expect(screen.getByText("JUEGOS CLÁSICOS")).toBeInTheDocument();
    expect(screen.getByText("SIEMPRE CRECIENDO")).toBeInTheDocument();
  });

  it("renderiza solo 6 mini-tarjetas con enlace a /games/<id>", () => {
    const { container } = render(<HomeView games={games} error={null} />);
    const cards = Array.from(container.querySelectorAll("a.mini-card"));
    expect(cards).toHaveLength(6);
    expect(cards.map((c) => c.getAttribute("href"))).toEqual(
      games.slice(0, 6).map((g) => `/games/${g.id}`),
    );
    expect(screen.getByText("JUEGO 1")).toBeInTheDocument();
    expect(screen.queryByText("JUEGO 7")).toBeNull();
  });

  it("los CTAs navegan a /games, /auth y /hall-of-fame", () => {
    render(<HomeView games={games} error={null} />);
    expect(hrefOf(/EXPLORAR JUEGOS/)).toEqual(["/games"]);
    expect(hrefOf(/VER TODOS LOS JUEGOS/)).toEqual(["/games"]);
    expect(hrefOf(/INSERTAR MONEDA/)).toEqual(["/games"]);
    expect(hrefOf(/CREAR CUENTA/)).toEqual(["/auth"]);
    expect(hrefOf(/EMPEZAR GRATIS/)).toEqual(["/auth"]);
    expect(hrefOf(/VER SALÓN/)).toEqual(["/hall-of-fame"]);
  });

  it("formatea las puntuaciones en es-ES", () => {
    render(<HomeView games={games} error={null} />);
    expect(screen.getByText(`+${(184220).toLocaleString("es-ES")}`)).toBeInTheDocument();
    expect(screen.getByText((312840).toLocaleString("es-ES"))).toBeInTheDocument();
  });

  it("con error muestra el mensaje y enlace a /games, sin tarjetas, y el resto sigue", () => {
    const { container } = render(<HomeView games={[]} error="No se pudieron cargar los juegos." />);
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar los juegos.");
    expect(container.querySelectorAll("a.mini-card")).toHaveLength(0);
    expect(hrefOf(/VER TODOS LOS JUEGOS/)).toEqual(["/games"]);
    expect(screen.getByRole("heading", { name: "PRECIOS" })).toBeInTheDocument();
  });
});
