import { connection } from "next/server";
import { getCurrentUser } from "@/modules/auth/server";
import { errorResponse } from "@/shared/infrastructure/http/error-response";
import { UnauthorizedError } from "@/shared/kernel/errors";

export async function GET() {
  // Lee la cookie de sesión: se resuelve solo en tiempo de petición, nunca en el prerender.
  await connection();
  try {
    const user = await getCurrentUser.execute();
    if (!user) throw new UnauthorizedError("No hay una sesión activa.");
    return Response.json({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
