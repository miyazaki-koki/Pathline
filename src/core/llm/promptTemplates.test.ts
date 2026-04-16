import { describe, expect, it } from "vitest";
import { CATEGORY_ORDER } from "../categories";
import { systemPrompt, userPrompt, type PromptLang } from "./promptTemplates";

const LANGS: readonly PromptLang[] = ["ja", "en", "other"];
const VERBS: Record<string, string[]> = {
  improve: ["改善", "improve"],
  summarize: ["要約", "summariz"],
  clarify: ["整理", "clarif"],
  structure: ["構造", "structur"],
  review: ["レビュー", "review"],
};

describe("PromptTemplates (task 2.2)", () => {
  for (const cat of CATEGORY_ORDER) {
    for (const lang of LANGS) {
      it(`systemPrompt(${cat}, ${lang}) は空文字でない`, () => {
        expect(systemPrompt(cat, lang).length).toBeGreaterThan(0);
      });
    }
  }

  it("全 15 組合せの決定論 (同入力 → 同出力)", () => {
    for (const cat of CATEGORY_ORDER) {
      for (const lang of LANGS) {
        expect(systemPrompt(cat, lang)).toBe(systemPrompt(cat, lang));
      }
    }
  });

  for (const cat of CATEGORY_ORDER) {
    it(`${cat} の ja system には主動詞が含まれる`, () => {
      const prompt = systemPrompt(cat, "ja");
      const verbs = VERBS[cat];
      expect(verbs.some((v) => prompt.includes(v))).toBe(true);
    });
  }

  it("en の system は ASCII 文字で構成される", () => {
    for (const cat of CATEGORY_ORDER) {
      const prompt = systemPrompt(cat, "en");
      expect(/^[\x00-\x7F]+$/.test(prompt)).toBe(true);
    }
  });

  it("userPrompt は --- で入力を包む", () => {
    const result = userPrompt("hello world");
    expect(result).toBe("---\nhello world\n---");
  });

  it("other は ja 既定 + 入力言語追従の指示を含む", () => {
    for (const cat of CATEGORY_ORDER) {
      const prompt = systemPrompt(cat, "other");
      expect(prompt).toContain("入力");
    }
  });
});
