import type { User } from "../../domain/user";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  /** Sin distinguir mayúsculas. */
  findByUsername(username: string): Promise<User | null>;
  add(user: User): Promise<void>;
}
