import { registerUser } from "@/modules/auth/server";
import { errorResponse } from "@/shared/infrastructure/http/error-response";
import { asString, readJsonBody } from "@/shared/infrastructure/http/request-body";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const user = await registerUser.execute({
      username: asString(body.username),
      email: asString(body.email),
      password: asString(body.password),
    });
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
