import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createLanguageModelProvider } from "./languageModelProvider";
import type { LanguageModelCapability } from "./capability";
import type { SessionPool, DerivedSession } from "./sessionPool";

function mockCapability(status: string): LanguageModelCapability {
  return {
    detect: vi.fn().mockResolvedValue(status),
    cachedStatus: status as "readily" | "unavailable",
  };
}

function mockDerived(output = "改善されたテキスト。"): DerivedSession {
  return {
    prompt: vi.fn().mockResolvedValue(output),
    destroy: vi.fn(),
  };
}

function mockPool(derived?: DerivedSession): SessionPool {
  const d = derived ?? mockDerived();
  return {
    get: vi.fn().mockResolvedValue({
      clone: vi.fn().mockResolvedValue(d),
    }),
    dispose: vi.fn(),
  };
}

describe("LanguageModelProvider (task 3.2)", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it("readily で prompt 成功 → Candidate を返す", async () => {
    const derived = mockDerived("改善されたテキスト。");
    const provider = createLanguageModelProvider(mockCapability("readily"), mockPool(derived));
    const result = await provider.generate({ category: "improve", text: "元の入力" });
    expect(result).not.toBeNull();
    expect(result!.category).toBe("improve");
    expect(result!.body).toContain("改善されたテキスト。");
    expect(result!.hash).toBeTruthy();
  });

  it("同入力で hash が決定論的", async () => {
    const derived = mockDerived("同じ出力。");
    const pool = mockPool(derived);
    const provider = createLanguageModelProvider(mockCapability("readily"), pool);
    const a = await provider.generate({ category: "improve", text: "入力" });
    const b = await provider.generate({ category: "improve", text: "入力" });
    expect(a!.hash).toBe(b!.hash);
  });

  it("readily 以外 → null", async () => {
    const provider = createLanguageModelProvider(mockCapability("unavailable"), mockPool());
    const result = await provider.generate({ category: "improve", text: "入力" });
    expect(result).toBeNull();
  });

  it("2 秒タイムアウト → null (AbortError は warn しない)", async () => {
    const derived = mockDerived();
    derived.prompt = vi.fn().mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException("Aborted", "AbortError")), 10);
        }),
    );
    const provider = createLanguageModelProvider(mockCapability("readily"), mockPool(derived));
    const result = await provider.generate({ category: "improve", text: "入力" });
    expect(result).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it("外部 abort → null", async () => {
    const derived = mockDerived();
    derived.prompt = vi.fn().mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException("Aborted", "AbortError")), 10);
        }),
    );
    const ac = new AbortController();
    ac.abort();
    const provider = createLanguageModelProvider(mockCapability("readily"), mockPool(derived));
    const result = await provider.generate({ category: "improve", text: "入力" }, ac.signal);
    expect(result).toBeNull();
  });

  it("prompt throw (非 AbortError) → null + warn", async () => {
    const derived = mockDerived();
    derived.prompt = vi.fn().mockRejectedValue(new Error("runtime error"));
    const provider = createLanguageModelProvider(mockCapability("readily"), mockPool(derived));
    const result = await provider.generate({ category: "improve", text: "入力" });
    expect(result).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("言語ミスマッチで Sanitizer 拒否 → null", async () => {
    const derived = mockDerived("English only output without any Japanese.");
    const provider = createLanguageModelProvider(mockCapability("readily"), mockPool(derived));
    const result = await provider.generate({ category: "improve", text: "日本語の入力" });
    expect(result).toBeNull();
  });

  it("成功 / 失敗いずれも派生 session が destroy される", async () => {
    const derived = mockDerived();
    derived.prompt = vi.fn().mockRejectedValue(new Error("fail"));
    const provider = createLanguageModelProvider(mockCapability("readily"), mockPool(derived));
    await provider.generate({ category: "improve", text: "入力" });
    expect(derived.destroy).toHaveBeenCalledTimes(1);
  });
});
