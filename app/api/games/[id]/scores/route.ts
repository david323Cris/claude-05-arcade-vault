import { getGameScores } from "@/modules/scores/server";
import { errorResponse } from "@/shared/infrastructure/http/error-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const limitParam = new URL(request.url).searchParams.get("limit");
    const limit = limitParam === null ? undefined : Number(limitParam);
    return Response.json(await getGameScores.execute({ gameId: id, limit }));
  } catch (error) {
    return errorResponse(error);
  }
}
