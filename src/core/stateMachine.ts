import { CATEGORY_ORDER, type CategoryId } from "./categories";
import type { ScoreVector } from "./scoring";

export interface CategoryStateMachine {
  reduce(vec: ScoreVector): CategoryId;
  cycle(direction: 1 | -1): CategoryId;
  reset(): void;
  readonly current: CategoryId;
}

const SWITCH_DIFF = 2;
const SWITCH_STREAK = 2;

export function createStateMachine(): CategoryStateMachine {
  let current: CategoryId | null = null;
  let challenger: CategoryId | null = null;
  let challengerStreak = 0;
  let manualLock = false;

  function indexOf(id: CategoryId): number {
    return CATEGORY_ORDER.indexOf(id);
  }

  function switchTo(next: CategoryId): void {
    current = next;
    challenger = null;
    challengerStreak = 0;
  }

  return {
    get current(): CategoryId {
      return current ?? "improve";
    },
    reduce(vec: ScoreVector): CategoryId {
      if (current === null) {
        switchTo(vec.topCategory);
        return current!;
      }

      if (vec.explicit) {
        manualLock = false;
        if (vec.topCategory !== current) switchTo(vec.topCategory);
        return current!;
      }

      if (manualLock) return current!;

      const top = vec.topCategory;
      if (top === current) {
        challenger = null;
        challengerStreak = 0;
        return current;
      }

      const diff = vec[top] - vec[current];
      if (diff >= SWITCH_DIFF) {
        switchTo(top);
        return current!;
      }

      if (challenger === top) {
        challengerStreak += 1;
      } else {
        challenger = top;
        challengerStreak = 1;
      }

      if (challengerStreak >= SWITCH_STREAK) {
        switchTo(top);
      }

      return current!;
    },
    cycle(direction: 1 | -1): CategoryId {
      const base = current ?? "improve";
      const idx = indexOf(base);
      const n = CATEGORY_ORDER.length;
      const nextIdx = (idx + direction + n) % n;
      const next = CATEGORY_ORDER[nextIdx];
      if (next !== undefined) {
        current = next;
        manualLock = true;
        challenger = null;
        challengerStreak = 0;
      }
      return current!;
    },
    reset(): void {
      current = null;
      challenger = null;
      challengerStreak = 0;
      manualLock = false;
    },
  };
}
