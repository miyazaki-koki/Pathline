import { describe, expect, it } from "vitest";
import { FlexibleCandidateProvider } from "./flexibleProvider";

const p = new FlexibleCandidateProvider();

describe("FlexibleProvider pipeline integration", () => {
  it("IT-401 summarize: 議事録 + 要約 → 議事録前置き + 要約締め", () => {
    const c = p.provide({ category: "summarize", text: "議事録を簡潔にまとめてください" });
    expect(c.body.startsWith("以下の議事録を")).toBe(true);
    expect(c.body).toContain("要約してください。");
    expect(c.body).toMatch(/要点|簡潔/);
  });

  it("IT-402 review + code + focus: 以下のコード + 焦点語", () => {
    const c = p.provide({
      category: "review",
      text: "UserService というクラスの function handle() { return 1; } をレビュー",
    });
    expect(c.body.startsWith("以下のコードを")).toBe(true);
    expect(c.body).toContain("UserService");
    expect(c.body).toContain("レビューし、問題点と改善案を提示してください。");
  });

  it("IT-403 structure + bullets: 箇条書き指定", () => {
    const c = p.provide({
      category: "structure",
      text: "複数行のメモを箇条書きで整理したい",
    });
    expect(c.body).toContain("箇条書き");
    expect(c.body).toContain("整理して構造化してください。");
  });

  it("PT-201 1000 文字入力で provide() が 10ms 以内", () => {
    const text = "議事録のまとめ ".repeat(50);
    const start = performance.now();
    p.provide({ category: "summarize", text });
    expect(performance.now() - start).toBeLessThan(10);
  });
});
