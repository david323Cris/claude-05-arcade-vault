import type { IdGenerator } from "@/shared/kernel/id-generator";

/** Ids deterministas: id-1, id-2… */
export class SequenceIdGenerator implements IdGenerator {
  private count = 0;

  next(): string {
    this.count += 1;
    return `id-${this.count}`;
  }
}
