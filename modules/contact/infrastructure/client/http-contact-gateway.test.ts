import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpContactGateway } from "./http-contact-gateway";

const fetchMock = vi.fn();
const input = { name: "Ana", email: "ana@example.com", message: "Hola", website: "" };
const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("HttpContactGateway", () => {
  it("hace POST /api/contact con el cuerpo en JSON y devuelve ok en 201", async () => {
    fetchMock.mockResolvedValue(json({ ok: true }, 201));

    expect(await new HttpContactGateway().submit(input)).toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/contact");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual(input);
  });

  it("400 → invalid", async () => {
    fetchMock.mockResolvedValue(json({ error: "invalid", fields: [] }, 400));
    expect(await new HttpContactGateway().submit(input)).toEqual({ ok: false, reason: "invalid" });
  });

  it("500 → failed", async () => {
    fetchMock.mockResolvedValue(json({ error: "send_failed" }, 500));
    expect(await new HttpContactGateway().submit(input)).toEqual({ ok: false, reason: "failed" });
  });

  it("error de red → failed (no lanza)", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect(await new HttpContactGateway().submit(input)).toEqual({ ok: false, reason: "failed" });
  });
});
