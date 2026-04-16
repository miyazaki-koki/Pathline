import { describe, expect, it } from "vitest";
import { TableDrivenComposer } from "./composer";
import type { Features } from "../feature/types";
import { EMPTY_FEATURES } from "../feature/types";
import { buildTemplate } from "../template";

const composer = new TableDrivenComposer();

function f(partial: Partial<Features> = {}): Features {
  return {
    target: "prose",
    tone: "neutral",
    format: "unknown",
    length: "unspecified",
    focus: [],
    empty: false,
    ...partial,
  };
}

describe("TableDrivenComposer", () => {
  it("empty features は buildTemplate と同一出力 (後方互換)", () => {
    expect(composer.compose("improve", "hello", EMPTY_FEATURES)).toBe(
      buildTemplate("improve", "hello"),
    );
  });

  it("summarize + concise → 要点のみ という表現を含む", () => {
    const out = composer.compose("summarize", "x", f({ length: "concise" }));
    expect(out).toMatch(/要点|簡潔/);
  });

  it("structure + bullets → 箇条書き", () => {
    const out = composer.compose("structure", "x", f({ format: "bullets" }));
    expect(out).toContain("箇条書き");
  });

  it("review + target=code → 以下のコード を前置き", () => {
    const out = composer.compose("review", "x", f({ target: "code" }));
    expect(out.startsWith("以下のコードを")).toBe(true);
  });

  it("clarify + focus → 特に X について を含む", () => {
    const out = composer.compose("clarify", "x", f({ focus: ["認証フロー"] }));
    expect(out).toContain("認証フロー");
  });

  it("summarize + table → 表形式 を含む", () => {
    const out = composer.compose("summarize", "x", f({ format: "table" }));
    expect(out).toContain("表形式");
  });

  it("同入力同出力 (決定論性)", () => {
    const feats = f({ target: "meeting_minutes", length: "concise", focus: ["決定事項"] });
    expect(composer.compose("summarize", "x", feats)).toBe(
      composer.compose("summarize", "x", feats),
    );
  });

  it("末尾に --- 区切りで text を含む", () => {
    const out = composer.compose("improve", "hello\nworld", f());
    expect(out).toContain("\n---\nhello\nworld\n---");
  });

  it("1 部品のみの features 変化で対応スロットのみが差替", () => {
    const a = composer.compose("summarize", "x", f());
    const b = composer.compose("summarize", "x", f({ format: "bullets" }));
    expect(a).not.toBe(b);
    // closing は両方同じ
    expect(a.endsWith("要約してください。\n---\nx\n---")).toBe(true);
    expect(b.endsWith("要約してください。\n---\nx\n---")).toBe(true);
  });
});
