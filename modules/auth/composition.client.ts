import type { AuthGateway } from "./application/ports/auth-gateway";
import { HttpAuthGateway } from "./infrastructure/client/http-auth-gateway";

export const authGateway: AuthGateway = new HttpAuthGateway();
