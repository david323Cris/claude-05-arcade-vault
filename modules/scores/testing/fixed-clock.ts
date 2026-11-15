import type { Clock } from "@/shared/kernel/clock";

export class FixedClock implements Clock {
  constructor(private readonly date = "14/11/2026") {}

  today(): string {
    return this.date;
  }
}
