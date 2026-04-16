import { describe, expect, it } from "vitest";
import { RuleBasedFeatureExtractor } from "./extractor";

const ext = new RuleBasedFeatureExtractor();

describe("RuleBasedFeatureExtractor — target", () => {
  it("function {} → code", () => {
    expect(ext.extract("function foo() { return 1; }").target).toBe("code");
  });
  it("議事録 → meeting_minutes", () => {
    expect(ext.extract("議事録の決定事項をまとめて").target).toBe("meeting_minutes");
  });
  it("仕様 → spec", () => {
    expect(ext.extract("この仕様書の要件を整理して").target).toBe("spec");
  });
  it("提案 → proposal", () => {
    expect(ext.extract("提案として書き直して").target).toBe("proposal");
  });
  it("どう → question", () => {
    expect(ext.extract("これどうすればいい？").target).toBe("question");
  });
  it("単独の ; → code 判定されない", () => {
    expect(ext.extract("abc; 日本語文").target).not.toBe("code");
  });
  it("4 文字未満 → empty & unknown", () => {
    const f = ext.extract("abc");
    expect(f.empty).toBe(true);
    expect(f.target).toBe("unknown");
  });
});

describe("RuleBasedFeatureExtractor — tone", () => {
  it("です/ます 2 件以上 → formal", () => {
    expect(ext.extract("こちらの文章です。よろしくお願いします。").tone).toBe("formal");
  });
  it("です/ます 1 件のみ → neutral", () => {
    expect(ext.extract("これですね").tone).toBe("neutral");
  });
  it("だよ → casual", () => {
    expect(ext.extract("これだよね、直してほしいかな").tone).toBe("casual");
  });
  it("該当語なし → neutral", () => {
    expect(ext.extract("abcdef").tone).toBe("neutral");
  });
});

describe("RuleBasedFeatureExtractor — format", () => {
  it("箇条書き → bullets", () => {
    expect(ext.extract("これを箇条書きにまとめて").format).toBe("bullets");
  });
  it("表で → table", () => {
    expect(ext.extract("結果を表でまとめてください").format).toBe("table");
  });
  it("該当語なし → unknown", () => {
    expect(ext.extract("abcdef").format).toBe("unknown");
  });
});

describe("RuleBasedFeatureExtractor — length", () => {
  it("簡潔に → concise", () => {
    expect(ext.extract("簡潔にまとめて").length).toBe("concise");
  });
  it("3 行で → concise", () => {
    expect(ext.extract("3行でまとめて").length).toBe("concise");
  });
  it("詳しく → detailed", () => {
    expect(ext.extract("詳しく説明して").length).toBe("detailed");
  });
  it("該当語なし → unspecified", () => {
    expect(ext.extract("abcdef").length).toBe("unspecified");
  });
});

describe("RuleBasedFeatureExtractor — focus", () => {
  it("UserService を含む", () => {
    expect(ext.extract("UserService をレビューしてください").focus).toContain("UserService");
  });
  it("鍵括弧内の語 (4-16文字) を拾う", () => {
    expect(ext.extract("「認証フロー」を整理して").focus).toContain("認証フロー");
  });
  it("ダブルクォート内の語を拾う", () => {
    expect(ext.extract('"決済処理" を改善').focus).toContain("決済処理");
  });
  it("3 文字以下は除外", () => {
    const f = ext.extract("Foo Bar Baz Qux を整理して");
    for (const w of f.focus) expect(w.length).toBeGreaterThanOrEqual(4);
  });
  it("17 文字以上は除外", () => {
    const long = "A".repeat(20);
    expect(ext.extract(`${long} を整理して`).focus).not.toContain(long);
  });
  it("上位 3 件まで", () => {
    const f = ext.extract("ComponentA ComponentB ComponentC ComponentD ComponentE を整理");
    expect(f.focus.length).toBeLessThanOrEqual(3);
  });
  it("重複は 1 件にまとめる", () => {
    const f = ext.extract("UserService と UserService の UserService を確認");
    const count = f.focus.filter((w) => w === "UserService").length;
    expect(count).toBeLessThanOrEqual(1);
  });
});

describe("RuleBasedFeatureExtractor — integration", () => {
  it("4 文字未満 → empty Features", () => {
    const f = ext.extract("abc");
    expect(f.empty).toBe(true);
  });
  it("10_001 文字 → 先頭 10_000 のみ", () => {
    const base = "a".repeat(10_000);
    const tail = "UniqueFocus";
    const f = ext.extract(base + tail);
    expect(f.focus).not.toContain(tail);
  });
  it("参照透過性: 同入力同出力", () => {
    expect(ext.extract("議事録を簡潔にまとめて")).toEqual(
      ext.extract("議事録を簡潔にまとめて"),
    );
  });
  it("1000 文字入力で 5ms 以内", () => {
    const t = "abc ".repeat(250);
    const start = performance.now();
    ext.extract(t);
    expect(performance.now() - start).toBeLessThan(5);
  });
});
