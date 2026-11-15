import "server-only";
import { readJson } from "@/shared/infrastructure/json-store";
import type { CategoryRepository } from "../../application/ports/category-repository";

export class JsonCategoryRepository implements CategoryRepository {
  findAll(): Promise<string[]> {
    return readJson<string[]>("categories.json");
  }
}
