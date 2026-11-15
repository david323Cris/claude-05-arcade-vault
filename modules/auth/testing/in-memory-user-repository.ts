import type { UserRepository } from "../application/ports/user-repository";
import type { User } from "../domain/user";

export class InMemoryUserRepository implements UserRepository {
  private readonly users: User[];

  constructor(users: User[] = []) {
    this.users = [...users];
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const wanted = username.toLowerCase();
    return this.users.find((user) => user.username.toLowerCase() === wanted) ?? null;
  }

  async add(user: User): Promise<void> {
    this.users.push(user);
  }
}
