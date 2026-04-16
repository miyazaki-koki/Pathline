import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const LLM_DIR = join(process.cwd(), "src/core/llm");
const TWO_LAYER_DIR = join(process.cwd(), "src/core/twoLayer");

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...listTsFiles(p));
    else if (name.endsWith(".ts") && !name.includes(".test.")) out.push(p);
  }
  return out;
}

describe("LLM layer security / privacy (task 7.5)", () => {
  const files = [...listTsFiles(LLM_DIR), ...listTsFiles(TWO_LAYER_DIR)];

  it("LLM 実装に fetch / XMLHttpRequest / WebSocket が含まれない", () => {
    const forbidden = [/\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bWebSocket\b/];
    for (const file of files) {
      const src = readFileSync(file, "utf-8");
      for (const pat of forbidden) {
        expect(pat.test(src), `${file} contains forbidden ${pat}`).toBe(false);
      }
    }
  });

  it("warn/console 出力にユーザー入力や prompt 本文を含めない (理由文字列のみ)", () => {
    for (const file of files) {
      const src = readFileSync(file, "utf-8");
      const warnMatches = src.match(/console\.warn\s*\([^)]*\)/g) ?? [];
      for (const call of warnMatches) {
        expect(
          /\buserPrompt\b|\bsystemPrompt\b|\breq\.text\b/.test(call),
          `${file}: console.warn must not include prompt/user text: ${call}`,
        ).toBe(false);
      }
    }
  });
});
