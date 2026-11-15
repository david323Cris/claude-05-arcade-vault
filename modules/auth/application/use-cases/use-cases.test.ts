import { describe, expect, it } from "vitest";
import { ConflictError, UnauthorizedError, ValidationError } from "@/shared/kernel/errors";
import { sampleUsers } from "../../testing/fixtures";
import { InMemorySessionStore } from "../../testing/in-memory-session-store";
import { InMemoryUserRepository } from "../../testing/in-memory-user-repository";
import { SequenceIdGenerator } from "../../testing/sequence-id-generator";
import { GetCurrentUser } from "./get-current-user";
import { LoginUser } from "./login-user";
import { LogoutUser } from "./logout-user";
import { RegisterUser } from "./register-user";

function setup() {
  const users = new InMemoryUserRepository(sampleUsers);
  const session = new InMemorySessionStore();
  return {
    users,
    session,
    register: new RegisterUser(users, session, new SequenceIdGenerator()),
    login: new LoginUser(users, session),
    logout: new LogoutUser(session),
    current: new GetCurrentUser(users, session),
  };
}

const valid = { username: "Ana_01", email: "ana@vault.gg", password: "secreto" };

describe("LoginUser", () => {
  it("credenciales correctas → SessionUser (sin password) y sesión iniciada", async () => {
    const { login, session } = setup();
    const user = await login.execute({ username: "PX_KAI", password: "vault123" });
    expect(user).toEqual({ id: "u1", name: "PX_KAI" });
    expect(user).not.toHaveProperty("password");
    expect(await session.getUserId()).toBe("u1");
  });

  it("el usuario no distingue mayúsculas y name va en MAYÚSCULAS", async () => {
    const { login } = setup();
    expect(await login.execute({ username: "player1", password: "vault123" })).toEqual({
      id: "u2",
      name: "PLAYER1",
    });
  });

  it("contraseña incorrecta o usuario inexistente → UnauthorizedError sin iniciar sesión", async () => {
    const { login, session } = setup();
    await expect(login.execute({ username: "PX_KAI", password: "mala" })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    await expect(login.execute({ username: "nadie", password: "vault123" })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(await session.getUserId()).toBeNull();
  });
});

describe("RegisterUser", () => {
  it("registra, inicia sesión y devuelve SessionUser", async () => {
    const { register, users, session } = setup();
    const user = await register.execute(valid);
    expect(user).toEqual({ id: "id-1", name: "ANA_01" });
    expect(await users.findById("id-1")).toMatchObject(valid);
    expect(await session.getUserId()).toBe("id-1");
  });

  it("usuario existente (otra capitalización) → ConflictError", async () => {
    const { register } = setup();
    await expect(register.execute({ ...valid, username: "px_kai" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it.each([
    ["usuario corto", { username: "ab" }],
    ["usuario largo", { username: "abcdefghijk" }],
    ["usuario con caracteres inválidos", { username: "ana!" }],
    ["usuario con espacio", { username: "a na" }],
    ["usuario vacío", { username: "" }],
    ["correo sin @", { email: "ana.vault.gg" }],
    ["correo sin dominio", { email: "ana@" }],
    ["contraseña corta", { password: "12345" }],
  ])("%s → ValidationError y no se crea el usuario", async (_label, override) => {
    const { register, users } = setup();
    await expect(register.execute({ ...valid, ...override })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(await users.findById("id-1")).toBeNull();
  });
});

describe("GetCurrentUser / LogoutUser", () => {
  it("sin sesión → null", async () => {
    expect(await setup().current.execute()).toBeNull();
  });

  it("con sesión → SessionUser sin password", async () => {
    const { login, current } = setup();
    await login.execute({ username: "PX_KAI", password: "vault123" });
    const user = await current.execute();
    expect(user).toEqual({ id: "u1", name: "PX_KAI" });
    expect(user).not.toHaveProperty("password");
  });

  it("sesión de un usuario inexistente → null", async () => {
    const users = new InMemoryUserRepository(sampleUsers);
    const current = new GetCurrentUser(users, new InMemorySessionStore("ghost"));
    expect(await current.execute()).toBeNull();
  });

  it("logout termina la sesión", async () => {
    const { login, logout, current } = setup();
    await login.execute({ username: "PX_KAI", password: "vault123" });
    await logout.execute();
    expect(await current.execute()).toBeNull();
  });
});
