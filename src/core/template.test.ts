import { describe, expect, it } from "vitest";
import { buildTemplate } from "./template";

describe("TemplateGenerator.buildTemplate", () => {
  it.each([
    ["improve", "以下の文章を分かりやすく自然な表現に改善してください。"],
    ["summarize", "以下の内容を簡潔に要約してください。"],
    ["clarify", "以下の相談内容を整理し、答えやすい質問文に改善してください。"],
    ["structure", "以下の内容を整理し、箇条書きで構造化してください。"],
    ["review", "以下の内容をレビューし、問題点と改善案を提示してください。"],
  ] as const)("%s: 定型テンプレ文を先頭に持つ", (cat, head) => {
    const out = buildTemplate(cat, "hello");
    expect(out.startsWith(head)).toBe(true);
  });

  it("入力テキストが --- で囲まれる", () => {
    const out = buildTemplate("improve", "hello");
    expect(out).toContain("\n---\nhello\n---");
  });

  it("複数行 text でも区切りが壊れない", () => {
    const out = buildTemplate("structure", "a\nb\nc");
    expect(out).toContain("\n---\na\nb\nc\n---");
  });

  it("空文字でも決定的に動作", () => {
    const out = buildTemplate("improve", "");
    expect(out).toContain("\n---\n\n---");
  });
});
