import { describe, expect, it } from "vitest";
import { sanitize } from "./outputSanitizer";

describe("OutputSanitizer (task 2.3)", () => {
  it("日本語前置き「こちらが改善文です。」を除去", () => {
    const r = sanitize("こちらが改善文です。本文はここ。", "入力", "ja");
    expect(r.body).not.toMatch(/^こちらが/);
    expect(r.accepted).toBe(true);
  });

  it("日本語前置き「以下が改善案です：」を除去", () => {
    const r = sanitize("以下が改善案です：本文はここ。", "入力", "ja");
    expect(r.body).not.toMatch(/^以下が/);
    expect(r.accepted).toBe(true);
  });

  it("英語前置き「Here is the revised text:」を除去", () => {
    const r = sanitize("Here is the revised text: The actual content.", "input", "en");
    expect(r.body).not.toMatch(/^Here is/);
    expect(r.accepted).toBe(true);
  });

  it("英語前置き「Sure,」を除去", () => {
    const r = sanitize("Sure, here you go. The content.", "input", "en");
    expect(r.body).not.toMatch(/^Sure/);
    expect(r.accepted).toBe(true);
  });

  it("framing 未含有 → \\n---\\n{text}\\n--- を付加", () => {
    const r = sanitize("改善されたテキスト。", "元の入力", "ja");
    expect(r.body).toContain("\n---\n元の入力\n---");
  });

  it("framing 既存 → 二重付加しない", () => {
    const body = "改善結果\n---\n元の入力\n---";
    const r = sanitize(body, "元の入力", "ja");
    const count = (r.body.match(/---/g) ?? []).length;
    expect(count).toBe(2);
  });

  it("ja 入力に英語のみの応答 → accepted=false", () => {
    const r = sanitize("This is the improved version.", "日本語の入力", "ja");
    expect(r.accepted).toBe(false);
  });

  it("ja 入力に日本語応答 → accepted=true", () => {
    const r = sanitize("改善されたテキストです。", "日本語の入力", "ja");
    expect(r.accepted).toBe(true);
  });

  it("en 入力に英語応答 → accepted=true (ja 以外は厳格チェックしない)", () => {
    const r = sanitize("The improved version.", "English input", "en");
    expect(r.accepted).toBe(true);
  });
});
