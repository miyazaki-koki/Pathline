export type CategoryId = "improve" | "summarize" | "clarify" | "structure" | "review";

export interface CategoryDefinition {
  readonly id: CategoryId;
  readonly label: string;
  readonly template: string;
}

export const CATEGORY_ORDER: readonly CategoryId[] = [
  "improve",
  "summarize",
  "clarify",
  "structure",
  "review",
] as const;

export const CATEGORIES: Readonly<Record<CategoryId, CategoryDefinition>> = {
  improve: {
    id: "improve",
    label: "Improve",
    template: "以下の文章を分かりやすく自然な表現に改善してください。",
  },
  summarize: {
    id: "summarize",
    label: "Summarize",
    template: "以下の内容を簡潔に要約してください。",
  },
  clarify: {
    id: "clarify",
    label: "Clarify",
    template: "以下の相談内容を整理し、答えやすい質問文に改善してください。",
  },
  structure: {
    id: "structure",
    label: "Structure",
    template: "以下の内容を整理し、箇条書きで構造化してください。",
  },
  review: {
    id: "review",
    label: "Review",
    template: "以下の内容をレビューし、問題点と改善案を提示してください。",
  },
} as const;
