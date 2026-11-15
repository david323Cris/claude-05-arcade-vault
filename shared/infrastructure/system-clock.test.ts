import { afterEach, describe, expect, it, vi } from "vitest";
import { SystemClock } from "./system-clock";
import { UuidIdGenerator } from "./uuid-id-generator";

afterEach(() => vi.useRealTimers());

describe("SystemClock", () => {
  it("devuelve la fecha como DD/MM/YYYY", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 5, 12));
    expect(new SystemClock().today()).toBe("05/03/2026");
  });
});

describe("UuidIdGenerator", () => {
  it("genera ids distintos", () => {
    const gen = new UuidIdGenerator();
    expect(gen.next()).not.toBe(gen.next());
  });
});
