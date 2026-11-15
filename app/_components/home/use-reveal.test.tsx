import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReveal } from "./use-reveal";

function Probe() {
  useReveal();
  return <div className="reveal" data-testid="el">x</div>;
}

afterEach(() => vi.unstubAllGlobals());

describe("useReveal", () => {
  it("añade `in` al intersectar y deja de observar el elemento", () => {
    let callback!: IntersectionObserverCallback;
    const observe = vi.fn();
    const unobserve = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) { callback = cb; }
        observe = observe;
        unobserve = unobserve;
        disconnect = disconnect;
      },
    );
    const { getByTestId, unmount } = render(<Probe />);
    const el = getByTestId("el");
    expect(observe).toHaveBeenCalledWith(el);
    expect(el.classList.contains("in")).toBe(false);

    callback([{ isIntersecting: false, target: el } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(el.classList.contains("in")).toBe(false);

    callback([{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(el.classList.contains("in")).toBe(true);
    expect(unobserve).toHaveBeenCalledWith(el);

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("sin IntersectionObserver muestra el contenido de inmediato", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { getByTestId } = render(<Probe />);
    expect(getByTestId("el").classList.contains("in")).toBe(true);
  });
});
