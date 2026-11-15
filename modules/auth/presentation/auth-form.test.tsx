import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const session = vi.hoisted(() => ({
  user: null as { id: string; name: string } | null,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("./session-provider", () => ({ useSession: () => session }));

import { AuthForm } from "./auth-form";

beforeEach(() => {
  vi.resetAllMocks();
  session.user = null;
});

describe("AuthForm", () => {
  it("la pestaña de inicio de sesión no pide correo", () => {
    render(<AuthForm />);
    expect(screen.getByLabelText("Usuario")).toBeInTheDocument();
    expect(screen.queryByLabelText("Correo electrónico")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ENTRAR AL VAULT" })).toBeInTheDocument();
  });

  it("la pestaña de crear cuenta muestra el correo", async () => {
    render(<AuthForm />);
    await userEvent.click(screen.getByRole("button", { name: "CREAR CUENTA" }));
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CREAR Y JUGAR" })).toBeInTheDocument();
  });

  it("login correcto llama a login y redirige a /", async () => {
    session.login.mockResolvedValue(undefined);
    render(<AuthForm />);
    await userEvent.type(screen.getByLabelText("Usuario"), "PX_KAI");
    await userEvent.type(screen.getByLabelText("Contraseña"), "vault123");
    await userEvent.click(screen.getByRole("button", { name: "ENTRAR AL VAULT" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(session.login).toHaveBeenCalledWith("PX_KAI", "vault123");
  });

  it("credenciales inválidas muestran el error de la API y no redirigen", async () => {
    session.login.mockRejectedValue(new Error("Usuario o contraseña incorrectos."));
    render(<AuthForm />);
    await userEvent.type(screen.getByLabelText("Usuario"), "PX_KAI");
    await userEvent.type(screen.getByLabelText("Contraseña"), "mala");
    await userEvent.click(screen.getByRole("button", { name: "ENTRAR AL VAULT" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Usuario o contraseña incorrectos.");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "ENTRAR AL VAULT" })).toBeEnabled();
  });

  it("registro correcto llama a register con correo y redirige", async () => {
    session.register.mockResolvedValue(undefined);
    render(<AuthForm />);
    await userEvent.click(screen.getByRole("button", { name: "CREAR CUENTA" }));
    await userEvent.type(screen.getByLabelText("Usuario"), "nuevo_1");
    await userEvent.type(screen.getByLabelText("Correo electrónico"), "n@vault.gg");
    await userEvent.type(screen.getByLabelText("Contraseña"), "secreto1");
    await userEvent.click(screen.getByRole("button", { name: "CREAR Y JUGAR" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(session.register).toHaveBeenCalledWith("nuevo_1", "n@vault.gg", "secreto1");
  });

  it("usuario repetido muestra el error de conflicto", async () => {
    session.register.mockRejectedValue(new Error("El usuario ya existe."));
    render(<AuthForm />);
    await userEvent.click(screen.getByRole("button", { name: "CREAR CUENTA" }));
    await userEvent.type(screen.getByLabelText("Usuario"), "px_kai");
    await userEvent.type(screen.getByLabelText("Correo electrónico"), "k@vault.gg");
    await userEvent.type(screen.getByLabelText("Contraseña"), "vault123");
    await userEvent.click(screen.getByRole("button", { name: "CREAR Y JUGAR" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El usuario ya existe.");
    expect(push).not.toHaveBeenCalled();
  });

  it("cambiar de pestaña limpia el error", async () => {
    session.login.mockRejectedValue(new Error("Falló."));
    render(<AuthForm />);
    await userEvent.click(screen.getByRole("button", { name: "ENTRAR AL VAULT" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "CREAR CUENTA" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("JUGAR COMO INVITADO cierra la sesión activa y va a /", async () => {
    session.user = { id: "u1", name: "PX_KAI" };
    session.signOut.mockResolvedValue(undefined);
    render(<AuthForm />);
    await userEvent.click(screen.getByRole("button", { name: "JUGAR COMO INVITADO" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(session.signOut).toHaveBeenCalled();
  });
});
