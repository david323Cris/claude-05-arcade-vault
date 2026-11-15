import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ value: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));
vi.mock("@/modules/auth", () => ({ useSession: () => ({ user: null, signOut: vi.fn() }) }));

import { Nav } from "./nav";

function activeLinks() {
  return screen
    .getAllByRole("link")
    .filter((a) => a.classList.contains("active"))
    .map((a) => a.textContent);
}

describe("Nav", () => {
  it("muestra Inicio, Biblioteca y Salón sin 'Acerca de'", () => {
    pathname.value = "/";
    render(<Nav />);
    expect(screen.getAllByRole("link", { name: "Inicio" })[0]).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: "Biblioteca" })[0]).toHaveAttribute("href", "/games");
    expect(screen.getAllByRole("link", { name: "Salón de la Fama" })[0]).toHaveAttribute("href", "/hall-of-fame");
    expect(screen.queryByText("Acerca de")).toBeNull();
  });

  it.each([
    ["/", "Inicio"],
    ["/games", "Biblioteca"],
    ["/games/caida", "Biblioteca"],
    ["/games/caida/play", "Biblioteca"],
    ["/hall-of-fame", "Salón de la Fama"],
  ])("en %s solo está activo %s", (path, label) => {
    pathname.value = path;
    const { unmount } = render(<Nav />);
    expect(new Set(activeLinks())).toEqual(new Set([label]));
    unmount();
  });

  it("en /auth no activa Inicio ni Biblioteca", () => {
    pathname.value = "/auth";
    render(<Nav />);
    expect(activeLinks()).not.toContain("Inicio");
    expect(activeLinks()).not.toContain("Biblioteca");
  });
});
