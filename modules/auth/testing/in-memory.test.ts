import { describeSessionStoreContract, describeUserRepositoryContract } from "./contracts";
import { InMemorySessionStore } from "./in-memory-session-store";
import { InMemoryUserRepository } from "./in-memory-user-repository";

describeUserRepositoryContract("InMemory", (users) => new InMemoryUserRepository(users));
describeSessionStoreContract("InMemory", () => new InMemorySessionStore());
