import type { CategoryRepository } from "../application/ports/category-repository";

export class InMemoryCategoryRepository implements CategoryRepository {
  constructor(private readonly categories: string[] = []) {}

  async findAll(): Promise<string[]> {
    return [...this.categories];
  }
}
