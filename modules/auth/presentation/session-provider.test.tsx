import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/infrastructure/http/http-client";
import type { AuthGateway } from "../application/ports/auth-gateway";

const gateway = vi.hoisted(() => ({
  me: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
})) as unknown as { [K in keyof AuthGateway]: ReturnType<typeof vi.fn> };

vi.mock("../composition.client", () => ({ authGateway: gateway }));

import { SessionProvider, useSession } from "./session-provider";

function Probe() {
  const { user, loading, login, signOut } = useSession();
  return (
    <div>
      <p data-testid="state">{loading ? "loading" : user ? user.name : "anon"}</p>
      <button onClick={() => login("px_kai", "vault123").catch(() => {})}>login</button>
      <button onClick={() => signOut()}>logout</button>
    </div>
  );
}

const kai = { id: "u1", name: "PX_KAI" };

function renderProbe() {
  return render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
}

describe("SessionProvider", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("arranca sin sesión y en carga hasta resolver me()", async () => {
    let resolveMe!: (v: null) => void;
    gateway.me.mockReturnValue(new Promise((r) => (resolveMe = r)));
    renderProbe();
    expect(screen.getByTestId("state")).toHaveTextContent("loading");
    await act(async () => resolveMe(null));
    expect(screen.getByTestId("state")).toHaveTextContent("anon");
  });

  it("restaura la sesión existente tras me()", async () => {
    gateway.me.mockResolvedValue(kai);
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("PX_KAI"));
  });

  it("login actualiza user", async () => {
    gateway.me.mockResolvedValue(null);
    gateway.login.mockResolvedValue(kai);
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("anon"));
    await userEvent.click(screen.getByText("login"));
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("PX_KAI"));
    expect(gateway.login).toHaveBeenCalledWith("px_kai", "vault123");
  });

  it("signOut vuelve a sin sesión", async () => {
    gateway.me.mockResolvedValue(kai);
    gateway.logout.mockResolvedValue(undefined);
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("PX_KAI"));
    await userEvent.click(screen.getByText("logout"));
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("anon"));
  });

  it("un ApiError 401 se expone como error y no cambia el usuario", async () => {
    gateway.me.mockResolvedValue(null);
    const error = new ApiError("Credenciales inválidas", 401);
    gateway.login.mockRejectedValue(error);

    let captured: unknown;
    function Capture() {
      const { login, loading } = useSession();
      return (
        <button
          disabled={loading}
          onClick={() => login("x", "y").catch((e) => (captured = e))}
        >
          go
        </button>
      );
    }
    render(
      <SessionProvider>
        <Capture />
      </SessionProvider>,
    );
    await waitFor(() => expect(screen.getByText("go")).toBeEnabled());
    await userEvent.click(screen.getByText("go"));
    await waitFor(() => expect(captured).toBe(error));
    expect((captured as ApiError).status).toBe(401);
  });

  it("useSession fuera del provider lanza", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/SessionProvider/);
    spy.mockRestore();
  });
});
