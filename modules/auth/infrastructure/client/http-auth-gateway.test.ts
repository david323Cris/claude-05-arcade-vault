import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/infrastructure/http/http-client";
import { HttpAuthGateway } from "./http-auth-gateway";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("window", {});
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
const user = { id: "u1", name: "PX_KAI" };

describe("HttpAuthGateway", () => {
  it("me → GET /api/auth/me y devuelve el usuario", async () => {
    fetchMock.mockResolvedValue(json({ user }));
    expect(await new HttpAuthGateway().me()).toEqual(user);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/me");
    expect(fetchMock.mock.calls[0][1].method).toBe("GET");
  });

  it("me devuelve null con 401 (sin sesión)", async () => {
    fetchMock.mockResolvedValue(json({ error: "No hay una sesión activa." }, 401));
    expect(await new HttpAuthGateway().me()).toBeNull();
  });

  it("me propaga los demás errores", async () => {
    fetchMock.mockResolvedValue(json({ error: "Error interno del servidor." }, 500));
    await expect(new HttpAuthGateway().me()).rejects.toBeInstanceOf(ApiError);
  });

  it("login → POST /api/auth/login con { username, password }", async () => {
    fetchMock.mockResolvedValue(json({ user }));
    expect(await new HttpAuthGateway().login("PX_KAI", "vault123")).toEqual(user);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ username: "PX_KAI", password: "vault123" });
  });

  it("login convierte { error } en ApiError con el mensaje de la API", async () => {
    fetchMock.mockResolvedValue(json({ error: "Usuario o contraseña incorrectos." }, 401));
    const result = new HttpAuthGateway().login("PX_KAI", "mala");
    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({
      message: "Usuario o contraseña incorrectos.",
      status: 401,
    });
  });

  it("register → POST /api/auth/register con { username, email, password }", async () => {
    fetchMock.mockResolvedValue(json({ user }, 201));
    expect(await new HttpAuthGateway().register("Ana_01", "a@b.co", "secreto")).toEqual(user);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/register");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      username: "Ana_01",
      email: "a@b.co",
      password: "secreto",
    });
  });

  it("register convierte el 409 en ApiError", async () => {
    fetchMock.mockResolvedValue(json({ error: "Ese usuario ya existe." }, 409));
    await expect(new HttpAuthGateway().register("Ana_01", "a@b.co", "secreto")).rejects.toEqual(
      expect.objectContaining({ message: "Ese usuario ya existe.", status: 409 }),
    );
  });

  it("logout → POST /api/auth/logout (204)", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await new HttpAuthGateway().logout()).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/logout");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });
});
