import { listGames } from "@/modules/games/server";
import { errorResponse } from "@/shared/infrastructure/http/error-response";

export async function GET() {
  try {
    return Response.json(await listGames.execute());
  } catch (error) {
    return errorResponse(error);
  }
}
