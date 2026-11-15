import { describe, expect, it } from "vitest";
import type { SessionStore } from "../application/ports/session-store";
import type { UserRepository } from "../application/ports/user-repository";
import type { User } from "../domain/user";
import { sampleUsers } from "./fixtures";

type Maybe<T> = T | Promise<T>;

/** Pruebas de contrato: toda implementación de UserRepository debe pasarlas. */
export function describeUserRepositoryContract(
  name: string,
  create: (users: User[]) => Maybe<UserRepository>,
) {
  describe(`UserRepository contract: ${name}`, () => {
    it("findById devuelve el usuario o null", async () => {
      const repo = await create(sampleUsers);
      expect(await repo.findById("u2")).toEqual(sampleUsers[1]);
      expect(await repo.findById("nope")).toBeNull();
    });

    it("findByUsername no distingue mayúsculas", async () => {
      const repo = await create(sampleUsers);
      expect(await repo.findByUsername("px_kai")).toEqual(sampleUsers[0]);
      expect(await repo.findByUsername("PX_KAI")).toEqual(sampleUsers[0]);
      expect(await repo.findByUsername("nadie")).toBeNull();
    });

    it("add persiste el usuario", async () => {
      const repo = await create(sampleUsers);
      const user = { id: "u3", username: "Ana", email: "a@b.co", password: "secreto" };
      await repo.add(user);
      expect(await repo.findById("u3")).toEqual(user);
      expect(await repo.findByUsername("ANA")).toEqual(user);
      expect(await repo.findById("u1")).toEqual(sampleUsers[0]);
    });
  });
}

/** Pruebas de contrato: toda implementación de SessionStore debe pasarlas. */
export function describeSessionStoreContract(
  name: string,
  create: () => Maybe<SessionStore>,
) {
  describe(`SessionStore contract: ${name}`, () => {
    it("sin sesión getUserId es null", async () => {
      expect(await (await create()).getUserId()).toBeNull();
    });

    it("start guarda el id y end lo borra", async () => {
      const store = await create();
      await store.start("u1");
      expect(await store.getUserId()).toBe("u1");
      await store.end();
      expect(await store.getUserId()).toBeNull();
    });
  });
}
