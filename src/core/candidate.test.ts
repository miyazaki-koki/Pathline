import { describe, expect, it } from "vitest";
import { RuleBasedCandidateProvider } from "./candidate";

describe("RuleBasedCandidateProvider", () => {
  const p = new RuleBasedCandidateProvider();

  it("同一 (category, text) は同一 hash", () => {
    const a = p.provide({ category: "improve", text: "hello" });
    const b = p.provide({ category: "improve", text: "hello" });
    expect(a.hash).toBe(b.hash);
  });

  it("text が変わると hash が変わる", () => {
    const a = p.provide({ category: "improve", text: "hello" });
    const b = p.provide({ category: "improve", text: "world" });
    expect(a.hash).not.toBe(b.hash);
  });

  it("category が変わると hash が変わる", () => {
    const a = p.provide({ category: "improve", text: "hello" });
    const b = p.provide({ category: "summarize", text: "hello" });
    expect(a.hash).not.toBe(b.hash);
  });

  it("body はテンプレを含む", () => {
    const c = p.provide({ category: "summarize", text: "hello" });
    expect(c.body).toContain("要約");
    expect(c.body).toContain("hello");
  });
});
