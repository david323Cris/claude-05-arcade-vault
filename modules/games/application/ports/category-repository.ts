export interface CategoryRepository {
  findAll(): Promise<string[]>;
}
