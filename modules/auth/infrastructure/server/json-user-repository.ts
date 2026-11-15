import "server-only";
import { readJson, updateJson } from "@/shared/infrastructure/json-store";
import type { UserRepository } from "../../application/ports/user-repository";
import type { User } from "../../domain/user";

const FILE = "users.json";

export class JsonUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const users = await readJson<User[]>(FILE);
    return users.find((user) => user.id === id) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const wanted = username.toLowerCase();
    const users = await readJson<User[]>(FILE);
    return users.find((user) => user.username.toLowerCase() === wanted) ?? null;
  }

  async add(user: User): Promise<void> {
    await updateJson<User[]>(FILE, (users) => [...users, user]);
  }
}
