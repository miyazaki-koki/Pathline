import { describe, expect, it } from "vitest";
import { FlexibleCandidateProvider } from "./flexibleProvider";

describe("FlexibleCandidateProvider", () => {
  const p = new FlexibleCandidateProvider();

  it("通常入力で Candidate を同期返却", () => {
    const c = p.provide({ category: "summarize", text: "議事録を簡潔にまとめて" });
    expect(c.category).toBe("summarize");
    expect(c.body).toContain("要約");
    expect(c.body).toContain("議事録を簡潔にまとめて");
    expect(c.hash.length).toBeGreaterThan(0);
  });

  it("同一 req → 同一 Candidate", () => {
    const a = p.provide({ category: "improve", text: "いい感じに直して" });
    const b = p.provide({ category: "improve", text: "いい感じに直して" });
    expect(a).toEqual(b);
  });

  it("text 変更で hash が変わる", () => {
    const a = p.provide({ category: "improve", text: "hello world" });
    const b = p.provide({ category: "improve", text: "hello worldo" });
    expect(a.hash).not.toBe(b.hash);
  });

  it("category 変更で hash が変わる", () => {
    const t = "同じテキスト";
    const a = p.provide({ category: "improve", text: t });
    const b = p.provide({ category: "summarize", text: t });
    expect(a.hash).not.toBe(b.hash);
  });

  it("review + code で 以下のコードを を先頭に含む", () => {
    const c = p.provide({ category: "review", text: "function f() { return 1; } をレビュー" });
    expect(c.body.startsWith("以下のコードを")).toBe(true);
  });
});
