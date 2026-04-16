import type { CategoryId } from "../categories";
import { buildTemplate } from "../template";
import type { Features } from "../feature/types";
import { PARTS_TABLE } from "./parts";
import { SLOT_ORDER, expand, type PartCandidate } from "./types";

function pickPart(candidates: readonly PartCandidate[], features: Features): PartCandidate | null {
  let best: PartCandidate | null = null;
  for (const c of candidates) {
    if (!c.when(features)) continue;
    if (!best || c.priority > best.priority || (c.priority === best.priority && c.id < best.id)) {
      best = c;
    }
  }
  return best;
}

export interface RecommendationComposer {
  compose(category: CategoryId, text: string, features: Features): string;
}

export class TableDrivenComposer implements RecommendationComposer {
  compose(category: CategoryId, text: string, features: Features): string {
    if (features.empty) return buildTemplate(category, text);
    const slots = PARTS_TABLE[category];
    const parts: string[] = [];
    for (const slot of SLOT_ORDER) {
      const picked = pickPart(slots[slot], features);
      if (picked) parts.push(expand(picked.text, features));
    }
    const head = parts.join("");
    return `${head}\n---\n${text}\n---`;
  }
}
