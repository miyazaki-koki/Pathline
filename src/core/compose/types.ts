import type { Features } from "../feature/types";

export type SlotId = "intro" | "focus" | "constraint" | "format" | "closing";

export const SLOT_ORDER: readonly SlotId[] = [
  "intro",
  "focus",
  "constraint",
  "format",
  "closing",
] as const;

export interface PartCandidate {
  readonly id: string;
  readonly text: string;
  readonly when: (f: Features) => boolean;
  readonly priority: number;
}

export function expand(text: string, f: Features): string {
  return text.replace(/\$\{focus\}/g, f.focus.join("、"));
}
