import { InMemoryScoreRepository } from "./in-memory-score-repository";
import { describeScoreRepositoryContract } from "./repositories.contract";

describeScoreRepositoryContract("InMemory", (data) => new InMemoryScoreRepository(data));
