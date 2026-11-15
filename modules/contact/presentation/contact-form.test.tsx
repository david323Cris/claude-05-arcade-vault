import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactSubmitResult } from "../application/ports/contact-gateway";

const submit = vi.hoisted(() => vi.fn());
vi.mock("../composition.client", () => ({ contactGateway: { submit } }));

import { ContactForm } from "./contact-form";

async function fill(user: ReturnType<typeof userEvent.setup>, name = " Ana ") {
  await user.type(screen.getByLabelText("NOMBRE"), name);
  await user.type(screen.getByLabelText("CORREO ELECTRÓNICO"), "ana@example.com");
  await user.type(screen.getByLabelText("MENSAJE"), "Hola equipo");
}
const sendButton = () => screen.getByRole("button", { name: /ENVIAR MENSAJE|ENVIANDO/ });
const formEl = (container: HTMLElement) => container.querySelector("form")!;

beforeEach(() => submit.mockReset());

describe("ContactForm", () => {
  it("con campos vacíos no llama al gateway y aplica shake (400 ms)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { container } = render(<ContactForm />);

      await user.click(sendButton());
      expect(submit).not.toHaveBeenCalled();
      expect(formEl(container)).toHaveClass("shake");

      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      expect(formEl(container)).not.toHaveClass("shake");
    } finally {
      vi.useRealTimers();
    }
  });

  it("campos con solo espacios cuentan como vacíos", async () => {
    const user = userEvent.setup();
    const { container } = render(<ContactForm />);
    await user.type(screen.getByLabelText("NOMBRE"), "   ");
    await user.type(screen.getByLabelText("CORREO ELECTRÓNICO"), "ana@example.com");
    await user.type(screen.getByLabelText("MENSAJE"), "  ");
    await user.click(sendButton());
    expect(submit).not.toHaveBeenCalled();
    expect(formEl(container)).toHaveClass("shake");
  });

  it("envío válido llama al gateway con website vacío y muestra la terminal en mayúsculas", async () => {
    submit.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);

    await fill(user);
    await user.click(sendButton());

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith({
      name: " Ana ",
      email: "ana@example.com",
      message: "Hola equipo",
      website: "",
    });
    expect(await screen.findByText("VAULT-OS // TERMINAL")).toBeInTheDocument();
    expect(screen.getByText(/GRACIAS, ANA\./)).toBeInTheDocument();
  });

  it("deshabilita el botón y muestra ENVIANDO… mientras envía (sin doble envío)", async () => {
    let resolve!: (r: ContactSubmitResult) => void;
    submit.mockReturnValue(new Promise<ContactSubmitResult>((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<ContactForm />);

    await fill(user);
    await user.click(sendButton());

    const button = screen.getByRole("button", { name: "ENVIANDO…" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(submit).toHaveBeenCalledTimes(1);

    await act(async () => resolve({ ok: true }));
    expect(await screen.findByText("VAULT-OS // TERMINAL")).toBeInTheDocument();
  });

  it("si el gateway falla muestra el error, conserva lo escrito y permite reintentar", async () => {
    submit.mockResolvedValueOnce({ ok: false, reason: "failed" }).mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);

    await fill(user, "Ana");
    await user.click(sendButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "NO SE PUDO ENVIAR EL MENSAJE. INTÉNTALO DE NUEVO.",
    );
    expect(screen.getByLabelText("NOMBRE")).toHaveValue("Ana");
    expect(screen.getByLabelText("CORREO ELECTRÓNICO")).toHaveValue("ana@example.com");
    expect(screen.getByLabelText("MENSAJE")).toHaveValue("Hola equipo");
    expect(sendButton()).toBeEnabled();

    await user.click(sendButton());
    expect(await screen.findByText("VAULT-OS // TERMINAL")).toBeInTheDocument();
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it("un 400 del servidor muestra el aviso de revisar los campos", async () => {
    submit.mockResolvedValue({ ok: false, reason: "invalid" });
    const user = userEvent.setup();
    render(<ContactForm />);

    await fill(user);
    await user.click(sendButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("REVISA LOS CAMPOS E INTÉNTALO DE NUEVO.");
  });

  it("ENVIAR OTRO MENSAJE vuelve al formulario con todo vacío", async () => {
    submit.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);

    await fill(user);
    await user.click(sendButton());
    await user.click(await screen.findByRole("button", { name: "ENVIAR OTRO MENSAJE" }));

    expect(screen.getByLabelText("NOMBRE")).toHaveValue("");
    expect(screen.getByLabelText("CORREO ELECTRÓNICO")).toHaveValue("");
    expect(screen.getByLabelText("MENSAJE")).toHaveValue("");
    expect(screen.queryByText("VAULT-OS // TERMINAL")).not.toBeInTheDocument();
  });

  it("el honeypot está oculto a lectores de pantalla y se envía tal cual si un bot lo rellena", async () => {
    submit.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);

    const honeypot = screen.getByTestId("contact-honeypot");
    expect(honeypot.closest("[aria-hidden='true']")).not.toBeNull();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("autocomplete", "off");

    await fill(user);
    await user.type(honeypot, "http://spam.example");
    await user.click(sendButton());

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(expect.objectContaining({ website: "http://spam.example" })),
    );
  });
});
