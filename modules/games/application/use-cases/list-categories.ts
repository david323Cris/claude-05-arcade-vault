import type { CategoryRepository } from "../ports/category-repository";

export class ListCategories {
  constructor(private readonly categories: CategoryRepository) {}

  execute(): Promise<string[]> {
    return this.categories.findAll();
  }
}
