import { InMemoryCategoryRepository } from "./in-memory-category-repository";
import { InMemoryGameRepository } from "./in-memory-game-repository";
import {
  describeCategoryRepositoryContract,
  describeGameRepositoryContract,
} from "./repositories.contract";

describeGameRepositoryContract("InMemory", (games) => new InMemoryGameRepository(games));
describeCategoryRepositoryContract(
  "InMemory",
  (categories) => new InMemoryCategoryRepository(categories),
);
