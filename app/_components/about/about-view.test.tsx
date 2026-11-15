import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/contact/composition.client", () => ({ contactGateway: { submit: vi.fn() } }));

import { AboutView } from "./about-view";

afterEach(() => vi.unstubAllGlobals());

describe("AboutView", () => {
  it("renderiza el hero con título y misión", () => {
    render(<AboutView />);
    expect(screen.getByRole("heading", { level: 1, name: "ACERCA DE ARCADE VAULT" })).toBeInTheDocument();
    expect(screen.getByText(/nació del amor por los videojuegos clásicos/)).toBeInTheDocument();
  });

  it("renderiza los 3 highlights con su icono", () => {
    const { container } = render(<AboutView />);
    const row = container.querySelector(".highlight-row") as HTMLElement;
    for (const text of [
      "HECHO CON ❤️ PARA JUGADORES",
      "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR",
      "PROYECTO EN CONSTANTE CRECIMIENTO",
    ]) {
      expect(within(row).getByText(text)).toBeInTheDocument();
    }
    expect(row.querySelectorAll(".highlight")).toHaveLength(3);
    expect(row.querySelectorAll("svg.hl-icon")).toHaveLength(3);
    expect(row.querySelector(".highlight.magenta")).not.toBeNull();
    expect(row.querySelector(".highlight.cyan")).not.toBeNull();
    expect(row.querySelector(".highlight.green")).not.toBeNull();
  });

  it("renderiza el divisor con 24 píxeles", () => {
    const { container } = render(<AboutView />);
    expect(container.querySelectorAll(".about-divider .div-pixels span")).toHaveLength(24);
  });

  it("renderiza la sección CONTÁCTANOS con los 3 tips y el formulario", () => {
    const { container } = render(<AboutView />);
    expect(screen.getByRole("heading", { level: 2, name: "CONTÁCTANOS" })).toBeInTheDocument();
    for (const tip of ["RESPUESTA EN 24-48H", "SUGERENCIAS BIENVENIDAS", "SIN SPAM, JAMÁS"]) {
      expect(screen.getByText(tip)).toBeInTheDocument();
    }
    expect(container.querySelectorAll(".contact-tips .tip")).toHaveLength(3);
    expect(screen.getByLabelText("NOMBRE")).toBeInTheDocument();
    expect(screen.getByLabelText("CORREO ELECTRÓNICO")).toBeInTheDocument();
    expect(screen.getByLabelText("MENSAJE")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ENVIAR MENSAJE/ })).toBeInTheDocument();
  });

  it("sin IntersectionObserver las secciones .reveal quedan visibles (.in)", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<AboutView />);
    const reveals = container.querySelectorAll(".reveal");
    expect(reveals.length).toBeGreaterThan(0);
    reveals.forEach((el) => expect(el).toHaveClass("in"));
  });

  it("con IntersectionObserver añade .in al entrar en pantalla", () => {
    let callback!: IntersectionObserverCallback;
    class IO {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", IO);
    const { container } = render(<AboutView />);
    const section = container.querySelector(".about-contact") as HTMLElement;
    expect(section).not.toHaveClass("in");

    callback(
      [{ isIntersecting: true, target: section } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(section).toHaveClass("in");
  });
});
