import type { CategoryId } from "../categories";
import type { Features } from "../feature/types";
import type { PartCandidate, SlotId } from "./types";

const hasFocus = (f: Features): boolean => f.focus.length > 0;

function introParts(defaultText: string, reviewFlavor: string | null = null): PartCandidate[] {
  const base: PartCandidate[] = [
    { id: "intro.code", text: "以下のコードを", when: (f) => f.target === "code", priority: 30 },
    {
      id: "intro.meeting",
      text: "以下の議事録を",
      when: (f) => f.target === "meeting_minutes",
      priority: 20,
    },
    { id: "intro.spec", text: "以下の仕様を", when: (f) => f.target === "spec", priority: 20 },
    {
      id: "intro.proposal",
      text: "以下の提案文を",
      when: (f) => f.target === "proposal",
      priority: 20,
    },
    { id: "intro.default", text: defaultText, when: () => true, priority: 0 },
  ];
  if (reviewFlavor) {
    base.push({
      id: "intro.review.default",
      text: reviewFlavor,
      when: (f) => f.target === "question" || f.target === "prose" || f.target === "unknown",
      priority: 10,
    });
  }
  return base;
}

const IMPROVE: Record<SlotId, readonly PartCandidate[]> = {
  intro: introParts("以下の文章を"),
  focus: [
    {
      id: "focus.emphasis",
      text: "特に ${focus} の表現に注意して、",
      when: hasFocus,
      priority: 10,
    },
  ],
  constraint: [
    {
      id: "constraint.detailed",
      text: "意図を保ったまま具体例も補足しつつ、",
      when: (f) => f.length === "detailed",
      priority: 10,
    },
  ],
  format: [
    {
      id: "format.concise",
      text: "簡潔な表現で、",
      when: (f) => f.length === "concise",
      priority: 30,
    },
    {
      id: "format.bullets",
      text: "箇条書きで、",
      when: (f) => f.format === "bullets",
      priority: 20,
    },
    { id: "format.formal", text: "フォーマルな文体で、", when: (f) => f.tone === "formal", priority: 10 },
    {
      id: "format.casual",
      text: "自然なカジュアル表現で、",
      when: (f) => f.tone === "casual",
      priority: 10,
    },
  ],
  closing: [
    {
      id: "closing.default",
      text: "分かりやすく自然な表現に改善してください。",
      when: () => true,
      priority: 0,
    },
  ],
};

const SUMMARIZE: Record<SlotId, readonly PartCandidate[]> = {
  intro: introParts("以下の内容を"),
  focus: [
    { id: "focus.center", text: "特に ${focus} を中心に、", when: hasFocus, priority: 10 },
  ],
  constraint: [
    {
      id: "constraint.concise",
      text: "要点のみを押さえて、",
      when: (f) => f.length === "concise",
      priority: 20,
    },
    {
      id: "constraint.detailed",
      text: "主要ポイントを網羅的に、",
      when: (f) => f.length === "detailed",
      priority: 20,
    },
  ],
  format: [
    { id: "format.bullets", text: "箇条書きで、", when: (f) => f.format === "bullets", priority: 30 },
    { id: "format.table", text: "表形式で、", when: (f) => f.format === "table", priority: 30 },
  ],
  closing: [
    { id: "closing.default", text: "要約してください。", when: () => true, priority: 0 },
  ],
};

const CLARIFY: Record<SlotId, readonly PartCandidate[]> = {
  intro: introParts("以下の相談内容を"),
  focus: [
    {
      id: "focus.specific",
      text: "特に ${focus} について明確にし、",
      when: hasFocus,
      priority: 10,
    },
  ],
  constraint: [
    {
      id: "constraint.context",
      text: "背景と目的を補いつつ、",
      when: (f) => f.length === "detailed" || f.target === "question",
      priority: 10,
    },
  ],
  format: [
    {
      id: "format.concise",
      text: "簡潔な文に、",
      when: (f) => f.length === "concise",
      priority: 20,
    },
    {
      id: "format.formal",
      text: "ですます調で、",
      when: (f) => f.tone === "formal",
      priority: 10,
    },
  ],
  closing: [
    {
      id: "closing.default",
      text: "答えやすい質問文に整理してください。",
      when: () => true,
      priority: 0,
    },
  ],
};

const STRUCTURE: Record<SlotId, readonly PartCandidate[]> = {
  intro: introParts("以下の内容を"),
  focus: [
    { id: "focus.axis", text: "${focus} を軸に、", when: hasFocus, priority: 10 },
  ],
  constraint: [
    {
      id: "constraint.detailed",
      text: "階層を意識しつつ、",
      when: (f) => f.length === "detailed",
      priority: 10,
    },
  ],
  format: [
    { id: "format.table", text: "表形式で、", when: (f) => f.format === "table", priority: 30 },
    {
      id: "format.bullets",
      text: "箇条書きで、",
      when: (f) => f.format === "bullets" || f.format === "unknown",
      priority: 20,
    },
  ],
  closing: [
    {
      id: "closing.default",
      text: "整理して構造化してください。",
      when: () => true,
      priority: 0,
    },
  ],
};

const REVIEW: Record<SlotId, readonly PartCandidate[]> = {
  intro: introParts("以下の内容を"),
  focus: [
    {
      id: "focus.emphasis",
      text: "特に ${focus} に焦点を当て、",
      when: hasFocus,
      priority: 10,
    },
  ],
  constraint: [
    {
      id: "constraint.detailed",
      text: "具体例と根拠を示しながら、",
      when: (f) => f.length === "detailed",
      priority: 10,
    },
    {
      id: "constraint.concise",
      text: "重要な論点に絞って、",
      when: (f) => f.length === "concise",
      priority: 10,
    },
  ],
  format: [
    { id: "format.bullets", text: "箇条書きで、", when: (f) => f.format === "bullets", priority: 20 },
    { id: "format.table", text: "表形式で、", when: (f) => f.format === "table", priority: 20 },
  ],
  closing: [
    {
      id: "closing.default",
      text: "レビューし、問題点と改善案を提示してください。",
      when: () => true,
      priority: 0,
    },
  ],
};

export const PARTS_TABLE: Readonly<Record<CategoryId, Readonly<Record<SlotId, readonly PartCandidate[]>>>> =
  {
    improve: IMPROVE,
    summarize: SUMMARIZE,
    clarify: CLARIFY,
    structure: STRUCTURE,
    review: REVIEW,
  };
