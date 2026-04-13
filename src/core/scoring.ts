import { CATEGORY_ORDER, type CategoryId } from "./categories";

export interface ScoreVector {
  readonly improve: number;
  readonly summarize: number;
  readonly clarify: number;
  readonly structure: number;
  readonly review: number;
  readonly explicit: boolean;
  readonly topCategory: CategoryId;
}

const MAX_INPUT = 10_000;

interface Rule {
  readonly test: (t: string) => boolean;
  readonly category: CategoryId;
  readonly points: number;
  readonly explicit?: boolean;
  readonly extra?: ReadonlyArray<{ category: CategoryId; points: number }>;
}

const RULES: readonly Rule[] = [
  {
    test: (t) => t.length > 120,
    category: "summarize",
    points: 3,
    extra: [{ category: "structure", points: 1 }],
  },
  { test: (t) => t.includes("\n"), category: "structure", points: 2 },
  { test: (t) => t.includes("?") || t.includes("？"), category: "clarify", points: 2 },
  {
    test: (t) =>
      t.includes("いい感じ") || t.includes("直して") || t.includes("整えて") || t.includes("改善"),
    category: "improve",
    points: 3,
  },
  { test: (t) => t.includes("要約"), category: "summarize", points: 5, explicit: true },
  {
    test: (t) => t.includes("レビュー") || t.includes("問題点"),
    category: "review",
    points: 5,
    explicit: true,
  },
  {
    test: (t) => t.includes("整理") || t.includes("まとめ"),
    category: "structure",
    points: 4,
    explicit: true,
  },
  {
    test: (t) => t.includes("どう思う") || t.includes("どうすれば"),
    category: "clarify",
    points: 3,
    explicit: true,
  },
  { test: (t) => /[{}();=]/.test(t), category: "review", points: 3 },
];

export function score(text: string): ScoreVector {
  const sliced = text.length > MAX_INPUT ? text.slice(0, MAX_INPUT) : text;

  const scores: Record<CategoryId, number> = {
    improve: 0,
    summarize: 0,
    clarify: 0,
    structure: 0,
    review: 0,
  };
  let explicit = false;

  if (sliced.length > 0) {
    for (const rule of RULES) {
      if (rule.test(sliced)) {
        scores[rule.category] += rule.points;
        if (rule.explicit) explicit = true;
        if (rule.extra) {
          for (const e of rule.extra) scores[e.category] += e.points;
        }
      }
    }
  }

  let topCategory: CategoryId = "improve";
  let topScore = -1;
  for (const id of CATEGORY_ORDER) {
    const s = scores[id];
    if (s > topScore) {
      topScore = s;
      topCategory = id;
    }
  }

  return {
    ...scores,
    explicit,
    topCategory,
  };
}
