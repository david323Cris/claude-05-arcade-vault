import { sendContactMessage } from "@/modules/contact/server";
import { readJsonBody, asString } from "@/shared/infrastructure/http/request-body";
import { ValidationError } from "@/shared/kernel/errors";

const invalid = (fields: unknown[] = []) =>
  Response.json({ error: "invalid", fields }, { status: 400 });

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof ValidationError) return invalid();
    throw error;
  }

  try {
    const result = await sendContactMessage.execute({
      name: asString(body.name),
      email: asString(body.email),
      message: asString(body.message),
      website: asString(body.website),
    });
    if (!result.ok) return invalid(result.errors);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    // El detalle (Resend caído, falta una variable de entorno…) solo se registra en el servidor.
    console.error("[contact] No se pudo enviar el mensaje:", error);
    return Response.json({ error: "send_failed" }, { status: 500 });
  }
}
