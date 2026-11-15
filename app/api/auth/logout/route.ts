import { logoutUser } from "@/modules/auth/server";
import { errorResponse } from "@/shared/infrastructure/http/error-response";

export async function POST() {
  try {
    await logoutUser.execute();
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
