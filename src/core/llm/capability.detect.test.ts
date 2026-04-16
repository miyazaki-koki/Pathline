import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createLanguageModelCapability } from "./capability";

interface FakeLM {
  availability: ReturnType<typeof vi.fn>;
}

function install(lm: FakeLM | undefined): void {
  (globalThis as unknown as { LanguageModel?: FakeLM }).LanguageModel = lm;
}

describe("LanguageModelCapability.detect (task 1.2)", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    install(undefined);
    warn.mockRestore();
  });

  it("LanguageModel 不在 → unavailable", async () => {
    install(undefined);
    const cap = createLanguageModelCapability();
    expect(await cap.detect()).toBe("unavailable");
    expect(cap.cachedStatus).toBe("unavailable");
  });

  it("availability() が readily を返せば readily", async () => {
    const lm: FakeLM = { availability: vi.fn().mockResolvedValue("readily") };
    install(lm);
    const cap = createLanguageModelCapability();
    expect(await cap.detect()).toBe("readily");
    expect(cap.cachedStatus).toBe("readily");
  });

  it("availability() が throw すれば unavailable + warn 1 回", async () => {
    const lm: FakeLM = { availability: vi.fn().mockRejectedValue(new Error("boom")) };
    install(lm);
    const cap = createLanguageModelCapability();
    expect(await cap.detect()).toBe("unavailable");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("2 回目の detect() は API を再呼び出ししない", async () => {
    const lm: FakeLM = { availability: vi.fn().mockResolvedValue("readily") };
    install(lm);
    const cap = createLanguageModelCapability();
    await cap.detect();
    await cap.detect();
    expect(lm.availability).toHaveBeenCalledTimes(1);
  });

  it("一度 unavailable に落ちたら以降の detect() でも unavailable", async () => {
    const lm: FakeLM = { availability: vi.fn().mockRejectedValue(new Error("x")) };
    install(lm);
    const cap = createLanguageModelCapability();
    expect(await cap.detect()).toBe("unavailable");
    lm.availability.mockResolvedValueOnce("readily");
    expect(await cap.detect()).toBe("unavailable");
  });

  it("初期状態では cachedStatus === null", () => {
    install(undefined);
    const cap = createLanguageModelCapability();
    expect(cap.cachedStatus).toBeNull();
  });

  it("detect() はオプションの inputLanguages/outputLanguages を availability() に渡す", async () => {
    const lm: FakeLM = { availability: vi.fn().mockResolvedValue("readily") };
    install(lm);
    const cap = createLanguageModelCapability();
    await cap.detect({ inputLanguages: ["ja"], outputLanguages: ["en"] });
    expect(lm.availability).toHaveBeenCalledWith({
      inputLanguages: ["ja"],
      outputLanguages: ["en"],
    });
  });
});
