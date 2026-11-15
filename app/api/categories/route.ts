import { listCategories } from "@/modules/games/server";
import { errorResponse } from "@/shared/infrastructure/http/error-response";

export async function GET() {
  try {
    return Response.json(await listCategories.execute());
  } catch (error) {
    return errorResponse(error);
  }
}
