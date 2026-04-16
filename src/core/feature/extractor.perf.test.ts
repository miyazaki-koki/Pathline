import { describe, expect, it } from "vitest";
import { RuleBasedFeatureExtractor } from "./extractor";

function makeInput(len: number): string {
  const unit = "このサービスを改善してほしい。議事録を要約したい。";
  let out = "";
  while (out.length < len) out += unit;
  return out.slice(0, len);
}

describe("extractor performance (PT-202)", () => {
  it("1000 文字入力で extract() が 5ms 以内", () => {
    const extractor = new RuleBasedFeatureExtractor();
    const text = makeInput(1000);
    extractor.extract(text);
    const iterations = 20;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) extractor.extract(text);
    const avg = (performance.now() - start) / iterations;
    expect(avg).toBeLessThan(5);
  });
});
