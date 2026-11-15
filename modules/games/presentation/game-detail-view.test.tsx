import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleGames } from "../testing/fixtures";
import { GameDetailView } from "./game-detail-view";

describe("GameDetailView", () => {
  it("muestra título, descripción, tags y stats", () => {
    render(<GameDetailView game={sampleGames[0]} />);
    expect(screen.getByRole("heading", { name: "BLOQUE BUSTER" })).toBeInTheDocument();
    expect(screen.getByText("Destruye muros de neón.")).toBeInTheDocument();
    expect(screen.getByText("ARCADE")).toBeInTheDocument();
    expect(screen.getByText("12.4K")).toBeInTheDocument();
    expect(screen.getByText((28450).toLocaleString("es-ES"))).toBeInTheDocument();
  });

  it("JUGAR AHORA y VOLVER AL VAULT enlazan a las rutas correctas", () => {
    render(<GameDetailView game={sampleGames[0]} />);
    expect(screen.getByRole("link", { name: /JUGAR AHORA/ })).toHaveAttribute("href", "/juegos/bloque-buster/jugar");
    expect(screen.getByRole("link", { name: "VOLVER AL VAULT" })).toHaveAttribute("href", "/");
  });

  it("renderiza children en la columna lateral", () => {
    render(
      <GameDetailView game={sampleGames[0]}>
        <p>lateral</p>
      </GameDetailView>,
    );
    expect(screen.getByText("lateral")).toBeInTheDocument();
  });
});
