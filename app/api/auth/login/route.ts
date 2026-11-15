import { loginUser } from "@/modules/auth/server";
import { errorResponse } from "@/shared/infrastructure/http/error-response";
import { asString, readJsonBody } from "@/shared/infrastructure/http/request-body";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const user = await loginUser.execute({
      username: asString(body.username),
      password: asString(body.password),
    });
    return Response.json({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
