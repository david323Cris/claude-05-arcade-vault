import { getGame } from "@/modules/games/server";
import { errorResponse } from "@/shared/infrastructure/http/error-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return Response.json(await getGame.execute(id));
  } catch (error) {
    return errorResponse(error);
  }
}
