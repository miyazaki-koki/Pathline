import { describe, expect, it } from "vitest";
import { score } from "./scoring";

describe("ScoringEngine.score", () => {
  it("120文字超: summarize +3, structure +1", () => {
    const text = "あ".repeat(130);
    const v = score(text);
    expect(v.summarize).toBeGreaterThanOrEqual(3);
    expect(v.structure).toBeGreaterThanOrEqual(1);
  });

  it("改行を含む: structure +2", () => {
    const v = score("hello\nworld");
    expect(v.structure).toBeGreaterThanOrEqual(2);
  });

  it("? または ？ を含む: clarify +2", () => {
    expect(score("これで合っている?").clarify).toBeGreaterThanOrEqual(2);
    expect(score("これで合っている？").clarify).toBeGreaterThanOrEqual(2);
  });

  it("曖昧改善語: improve +3", () => {
    expect(score("いい感じにして").improve).toBeGreaterThanOrEqual(3);
    expect(score("直してほしい").improve).toBeGreaterThanOrEqual(3);
    expect(score("整えて").improve).toBeGreaterThanOrEqual(3);
    expect(score("改善案").improve).toBeGreaterThanOrEqual(3);
  });

  it("要約: summarize +5 & explicit", () => {
    const v = score("これを要約して");
    expect(v.summarize).toBeGreaterThanOrEqual(5);
    expect(v.explicit).toBe(true);
  });

  it("レビュー/問題点: review +5 & explicit", () => {
    expect(score("レビューして").review).toBeGreaterThanOrEqual(5);
    expect(score("問題点を挙げて").review).toBeGreaterThanOrEqual(5);
    expect(score("レビューして").explicit).toBe(true);
  });

  it("整理/まとめ: structure +4 & explicit", () => {
    expect(score("整理して").structure).toBeGreaterThanOrEqual(4);
    expect(score("まとめて").structure).toBeGreaterThanOrEqual(4);
    expect(score("整理して").explicit).toBe(true);
  });

  it("どう思う/どうすれば: clarify +3 & explicit", () => {
    expect(score("これどう思う").clarify).toBeGreaterThanOrEqual(3);
    expect(score("どうすればいい").clarify).toBeGreaterThanOrEqual(3);
    expect(score("どう思う").explicit).toBe(true);
  });

  it("コード記号: review +3", () => {
    expect(score("function f() { return 1; }").review).toBeGreaterThanOrEqual(3);
  });

  it("空文字: 全カテゴリ 0", () => {
    const v = score("");
    expect(v.improve).toBe(0);
    expect(v.summarize).toBe(0);
    expect(v.clarify).toBe(0);
    expect(v.structure).toBe(0);
    expect(v.review).toBe(0);
    expect(v.explicit).toBe(false);
  });

  it("10_001 文字入力は先頭 10_000 文字のみ評価", () => {
    const base = "a".repeat(10_000);
    const tail = "?".repeat(1); // 先頭だけなら ? は含まれない
    const v = score(base + tail);
    // 10_000 a のみ評価されるので clarify 加算は発生しない
    expect(v.clarify).toBe(0);
  });

  it("参照透過性: 同一入力は同一スコア", () => {
    const a = score("これを要約して");
    const b = score("これを要約して");
    expect(a).toEqual(b);
  });

  it("topCategory は最高スコアを返す", () => {
    const v = score("これを要約して");
    expect(v.topCategory).toBe("summarize");
  });
});
