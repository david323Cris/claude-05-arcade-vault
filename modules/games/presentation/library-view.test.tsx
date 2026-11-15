import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleCategories, sampleGames } from "../testing/fixtures";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { LibraryView } from "./library-view";

const renderView = (props: Partial<Parameters<typeof LibraryView>[0]> = {}) =>
  render(<LibraryView games={sampleGames} categories={sampleCategories} {...props} />);

describe("LibraryView", () => {
  it("muestra todos los juegos con enlace al detalle", () => {
    renderView();
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /BLOQUE BUSTER/ })).toHaveAttribute(
      "href",
      "/games/bloque-buster",
    );
  });

  it("formatea la mejor puntuación en es-ES", () => {
    renderView();
    expect(screen.getByText((184220).toLocaleString("es-ES"))).toBeInTheDocument();
  });

  it("filtra por texto", async () => {
    renderView();
    await userEvent.type(screen.getByLabelText("Buscar un juego"), "caí");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText("CAÍDA")).toBeInTheDocument();
  });

  it("filtra por categoría", async () => {
    renderView();
    await userEvent.click(screen.getByRole("button", { name: "PUZZLE" }));
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText("CAÍDA")).toBeInTheDocument();
  });

  it("sin coincidencias muestra NO HAY RESULTADOS", async () => {
    renderView();
    await userEvent.type(screen.getByLabelText("Buscar un juego"), "zzz");
    expect(screen.getByText("NO HAY RESULTADOS")).toBeInTheDocument();
  });

  it("con error muestra el mensaje y reintenta", async () => {
    refresh.mockClear();
    renderView({ games: [], categories: [], error: "No se pudo conectar con el servidor." });
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo conectar con el servidor.");
    await userEvent.click(screen.getByRole("button", { name: "REINTENTAR" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
