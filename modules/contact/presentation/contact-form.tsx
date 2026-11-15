"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { contactGateway } from "../composition.client";

type Status = "idle" | "sending" | "sent" | "error";

const EMPTY = { name: "", email: "", message: "", website: "" };
const ERROR_TEXT = {
  invalid: "REVISA LOS CAMPOS E INTÉNTALO DE NUEVO.",
  failed: "NO SE PUDO ENVIAR EL MENSAJE. INTÉNTALO DE NUEVO.",
} as const;

export function ContactForm() {
  const uid = useId();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sentName, setSentName] = useState("");
  const [shake, setShake] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(shakeTimer.current), []);

  const set = (field: keyof typeof EMPTY) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setShake(true);
      clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setShake(false), 400);
      return;
    }

    setStatus("sending");
    setError(null);
    const result = await contactGateway.submit({
      name: form.name,
      email: form.email,
      message: form.message,
      website: form.website,
    });

    if (result.ok) {
      setSentName(form.name.trim());
      setStatus("sent");
    } else {
      setError(ERROR_TEXT[result.reason]);
      setStatus("error");
    }
  }

  function reset() {
    setForm(EMPTY);
    setSentName("");
    setError(null);
    setStatus("idle");
  }

  const sending = status === "sending";

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} onSubmit={onSubmit}>
      {status !== "sent" ? (
        <>
          <div className="field">
            <label htmlFor={`${uid}-name`}>NOMBRE</label>
            <input
              id={`${uid}-name`}
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="px_kai"
            />
          </div>
          <div className="field">
            <label htmlFor={`${uid}-email`}>CORREO ELECTRÓNICO</label>
            <input
              id={`${uid}-email`}
              type="email"
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label htmlFor={`${uid}-message`}>MENSAJE</label>
            <textarea
              id={`${uid}-message`}
              rows={5}
              value={form.message}
              onChange={(e) => set("message")(e.target.value)}
              placeholder="Cuéntanos qué tienes en mente…"
            />
          </div>
          {/* Honeypot: fuera de pantalla; solo los bots lo rellenan. */}
          <div className="contact-hp" aria-hidden="true">
            <input
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => set("website")(e.target.value)}
              data-testid="contact-honeypot"
            />
          </div>
          {error && (
            <div className="contact-error" role="alert">
              &gt; {error}
            </div>
          )}
          <button className="btn xl press" type="submit" style={{ width: "100%" }} disabled={sending}>
            {sending ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span>
            <span className="dot y"></span>
            <span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {sentName.toUpperCase()}.
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={reset}>
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
