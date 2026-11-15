import { connection } from "next/server";
import { getCurrentUser } from "@/modules/auth/server";
import { getGameScores, submitScore } from "@/modules/scores/server";
import { errorResponse } from "@/shared/infrastructure/http/error-response";
import { readJsonBody, asString } from "@/shared/infrastructure/http/request-body";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  // Lee la cookie de sesión: se resuelve solo en tiempo de petición, nunca en el prerender.
  await connection();
  try {
    const { id } = await params;
    const limitParam = new URL(request.url).searchParams.get("limit");
    const limit = limitParam === null ? undefined : Number(limitParam);
    // Orquestación entre módulos: `auth` da el usuario y `scores` solo recibe su nombre.
    const user = await getCurrentUser.execute();
    return Response.json(
      await getGameScores.execute({ gameId: id, limit, playerName: user?.name }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const entry = await submitScore.execute({
      gameId: id,
      name: asString(body.name),
      // Un valor que no es número se rechaza en el dominio (NaN no es un entero).
      score: typeof body.score === "number" ? body.score : Number.NaN,
    });
    return Response.json(entry, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
