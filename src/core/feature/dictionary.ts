import type { OutputFormat, TargetKind } from "./types";

export const TARGET_KEYWORDS: ReadonlyArray<{
  readonly kind: Exclude<TargetKind, "code" | "unknown" | "prose" | "question">;
  readonly words: readonly string[];
}> = [
  { kind: "meeting_minutes", words: ["議事録", "決定事項", "アジェンダ", "ミーティング", "打ち合わせ"] },
  { kind: "spec", words: ["仕様", "要件", "設計書", "仕様書", "リクワイアメント"] },
  { kind: "proposal", words: ["提案", "案として", "プロポーザル", "ご提案", "提案書"] },
] as const;

export const CODE_KEYWORDS: readonly string[] = [
  "function",
  "class ",
  "import ",
  "const ",
  "return ",
  "async ",
  "await ",
  "def ",
  "public ",
  "private ",
] as const;

export const CODE_SYMBOL_PATTERN = /[{}();=]{2,}|[{};][\s\S]{0,80}[{};]/;

export const QUESTION_MARKERS: readonly string[] = ["?", "？", "どう", "どうすれば", "なぜ"] as const;

export const FORMAL_MARKERS: readonly string[] = ["です", "ます", "ございます", "いたします"] as const;
export const CASUAL_MARKERS: readonly string[] = ["だよ", "じゃん", "だね", "かな", "っす"] as const;
export const TONE_FORMAL_THRESHOLD = 2;
export const TONE_CASUAL_THRESHOLD = 1;

export const FORMAT_RULES: ReadonlyArray<{
  readonly format: Exclude<OutputFormat, "unknown" | "free">;
  readonly words: readonly string[];
}> = [
  { format: "bullets", words: ["箇条書き", "リストで", "箇条書きで", "bullet"] },
  { format: "table", words: ["表で", "表形式", "テーブルで", "table"] },
  { format: "code", words: ["コードで", "サンプルコード", "実装して"] },
] as const;

export const CONCISE_MARKERS: readonly string[] = [
  "簡潔",
  "短く",
  "端的",
  "手短",
  "要点だけ",
] as const;
export const CONCISE_PATTERNS: readonly RegExp[] = [
  /\d+\s*行(で|以内|程度)/,
  /\d+\s*文字(で|以内|程度)/,
];

export const DETAILED_MARKERS: readonly string[] = [
  "詳しく",
  "丁寧に",
  "網羅的",
  "具体的に",
  "例を挙げて",
] as const;

export const FOCUS_PATTERNS: readonly RegExp[] = [
  /[A-Za-z_][A-Za-z0-9_.]{3,15}/g,
  /[\u30A0-\u30FF]{4,16}/g,
  /[「『]([^」』\n]{4,16})[」』]/g,
  /"([^"\n]{4,16})"/g,
];
