import type { CategoryId } from "../../categories";

export interface Fixture {
  readonly name: string;
  readonly category: CategoryId;
  readonly text: string;
}

const variations = (category: CategoryId, texts: readonly string[]): Fixture[] =>
  texts.map((text, i) => ({ name: `${category}-${i + 1}`, category, text }));

export const FIXTURES: readonly Fixture[] = [
  ...variations("improve", [
    "この文章を自然な表現にしてほしい。",
    "UserService のエラーメッセージを改善したい。",
    "ですます調の説明文を、もう少し読みやすくしたい。",
    "簡潔に直したい箇条書きのメモ。",
    "詳しく丁寧に書き直したい下書き。",
    "レビューコメントを自然に言い換えたい一文。",
  ]),
  ...variations("summarize", [
    "本日の議事録。決定事項: 来週までに設計レビュー。",
    "このコードの挙動を3行で要約してほしい。",
    "長いメール本文を表で要約したい。",
    "箇条書きで要点を整理してほしい会議メモ。",
    "詳しく網羅的にまとめたい調査ノート。",
    "仕様ドキュメントの概要を簡潔に。",
  ]),
  ...variations("clarify", [
    "どうすればデプロイが安定するか相談したい。",
    "認証フローについて質問したい。",
    "このエラーの原因を明確にしたい。",
    "チームに共有する前に、特にスコープを整理したい。",
    "曖昧な要件「ユーザー体験の改善」を具体化したい。",
    "複数人で意見が割れている論点を整理したい。",
  ]),
  ...variations("structure", [
    "複数行のメモを箇条書きで整理してほしい。",
    "調査結果を表でまとめたい。",
    "議事録の内容を階層化して整理したい。",
    "簡潔に箇条書きで整理してほしい。",
    "詳しく構造化したい長文ノート。",
    "設計メモをカテゴリ別に整理したい。",
  ]),
  ...variations("review", [
    "function f(){ return users.map(u => u.id) } このコードをレビュー。",
    "新機能の提案内容をレビューしてほしい。",
    "仕様ドキュメントの抜け漏れをレビューしたい。",
    "UserService のリファクタ案をレビューしてほしい。",
    "PR 本文を簡潔にレビューしてほしい。",
    "長文の要件定義を詳しくレビューしたい。",
  ]),
] as const;
