import "server-only";
import { UuidIdGenerator } from "@/shared/infrastructure/uuid-id-generator";
import { GetCurrentUser } from "./application/use-cases/get-current-user";
import { LoginUser } from "./application/use-cases/login-user";
import { LogoutUser } from "./application/use-cases/logout-user";
import { RegisterUser } from "./application/use-cases/register-user";
import { CookieSessionStore } from "./infrastructure/server/cookie-session-store";
import { JsonUserRepository } from "./infrastructure/server/json-user-repository";

const userRepository = new JsonUserRepository();
const sessionStore = new CookieSessionStore();
const idGenerator = new UuidIdGenerator();

export const registerUser = new RegisterUser(userRepository, sessionStore, idGenerator);
export const loginUser = new LoginUser(userRepository, sessionStore);
export const logoutUser = new LogoutUser(sessionStore);
export const getCurrentUser = new GetCurrentUser(userRepository, sessionStore);
