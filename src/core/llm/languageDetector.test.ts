import { describe, expect, it } from "vitest";
import { detectLanguage } from "./languageDetector";

describe("LanguageDetector (task 2.1)", () => {
  it("ひらがな含む日本語文 → ja", () => {
    expect(detectLanguage("議事録を要約してほしい")).toBe("ja");
  });

  it("カタカナ優位 → ja", () => {
    expect(detectLanguage("サービスをリファクタリング")).toBe("ja");
  });

  it("ASCII 英文のみ → en", () => {
    expect(detectLanguage("Please summarize this document.")).toBe("en");
  });

  it("中国語 (漢字のみ、ひらがな/カタカナ無し) → other", () => {
    expect(detectLanguage("请总结一下这个文件")).toBe("other");
  });

  it("空文字 → other", () => {
    expect(detectLanguage("")).toBe("other");
  });

  it("日英混在で日本語比率優位 → ja", () => {
    expect(detectLanguage("このAPIを使ってデータをfetchしてほしい")).toBe("ja");
  });

  it("日英混在で英語比率優位 → en", () => {
    expect(detectLanguage("Fetch the data from this API endpoint now")).toBe("en");
  });

  it("数字のみ → other", () => {
    expect(detectLanguage("12345678")).toBe("other");
  });
});
