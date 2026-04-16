import { describe, expect, it, vi } from "vitest";
import { createTwoLayerProvider } from "./twoLayerProvider";
import type { Candidate, CandidateProvider } from "../candidate";
import type { LanguageModelProvider } from "../llm/languageModelProvider";
import type { LanguageModelCapability } from "../llm/capability";
import type { AvailabilityStatus } from "../llm/capability";
import type { LLMSetting } from "../../settings/settingsStore";

function ruleProvider(body = "rule body"): CandidateProvider {
  return {
    provide: vi.fn().mockImplementation((req) => ({
      category: req.category,
      body,
      hash: `rule:${req.category}:${body}`,
    })),
  };
}

function llmProvider(result: Candidate | null): LanguageModelProvider {
  return {
    generate: vi.fn().mockResolvedValue(result),
  };
}

function capability(status: AvailabilityStatus): LanguageModelCapability {
  return {
    detect: vi.fn().mockResolvedValue(status),
    cachedStatus: status,
  };
}

function settingsGetter(llm: LLMSetting): () => LLMSetting {
  return () => llm;
}

describe("TwoLayerCandidateProvider (task 5)", () => {
  it("通常経路: immediate は Rule 出力 / pending は LLM 結果", async () => {
    const rule = ruleProvider("rule text");
    const llm: Candidate = { category: "improve", body: "llm text", hash: "llm:hash" };
    const provider = createTwoLayerProvider({
      rule,
      llm: llmProvider(llm),
      capability: capability("readily"),
      getLLMSetting: settingsGetter("auto"),
    });
    const ac = new AbortController();
    const { immediate, pending } = provider.provide({ category: "improve", text: "入力" }, ac.signal);
    expect(immediate.body).toBe("rule text");
    await expect(pending).resolves.toEqual(llm);
  });

  it("llm=off → pending は null resolve", async () => {
    const provider = createTwoLayerProvider({
      rule: ruleProvider(),
      llm: llmProvider({ category: "improve", body: "x", hash: "x" }),
      capability: capability("readily"),
      getLLMSetting: settingsGetter("off"),
    });
    const { pending } = provider.provide(
      { category: "improve", text: "入力" },
      new AbortController().signal,
    );
    await expect(pending).resolves.toBeNull();
  });

  it("capability=unavailable → pending は null resolve", async () => {
    const provider = createTwoLayerProvider({
      rule: ruleProvider(),
      llm: llmProvider({ category: "improve", body: "x", hash: "x" }),
      capability: capability("unavailable"),
      getLLMSetting: settingsGetter("auto"),
    });
    const { pending } = provider.provide(
      { category: "improve", text: "入力" },
      new AbortController().signal,
    );
    await expect(pending).resolves.toBeNull();
  });

  it("capability=after-download → pending は null (DL 起動しない)", async () => {
    const provider = createTwoLayerProvider({
      rule: ruleProvider(),
      llm: llmProvider({ category: "improve", body: "x", hash: "x" }),
      capability: capability("after-download"),
      getLLMSetting: settingsGetter("auto"),
    });
    const { pending } = provider.provide(
      { category: "improve", text: "入力" },
      new AbortController().signal,
    );
    await expect(pending).resolves.toBeNull();
  });

  it("capability=downloading → pending は null", async () => {
    const provider = createTwoLayerProvider({
      rule: ruleProvider(),
      llm: llmProvider({ category: "improve", body: "x", hash: "x" }),
      capability: capability("downloading"),
      getLLMSetting: settingsGetter("auto"),
    });
    const { pending } = provider.provide(
      { category: "improve", text: "入力" },
      new AbortController().signal,
    );
    await expect(pending).resolves.toBeNull();
  });

  it("同 req を 2 回 provide → immediate は決定論 / signal は毎回新規適用", async () => {
    const rule = ruleProvider("deterministic");
    const llm = llmProvider({ category: "improve", body: "llm", hash: "llm" });
    const provider = createTwoLayerProvider({
      rule,
      llm,
      capability: capability("readily"),
      getLLMSetting: settingsGetter("auto"),
    });
    const req = { category: "improve" as const, text: "入力" };
    const a = provider.provide(req, new AbortController().signal);
    const b = provider.provide(req, new AbortController().signal);
    expect(a.immediate.body).toBe(b.immediate.body);
    await Promise.all([a.pending, b.pending]);
    expect(llm.generate).toHaveBeenCalledTimes(2);
  });

  it("LLM が例外でも immediate は valid", async () => {
    const llm: LanguageModelProvider = {
      generate: vi.fn().mockRejectedValue(new Error("fail")),
    };
    const provider = createTwoLayerProvider({
      rule: ruleProvider("fallback"),
      llm,
      capability: capability("readily"),
      getLLMSetting: settingsGetter("auto"),
    });
    const { immediate, pending } = provider.provide(
      { category: "improve", text: "入力" },
      new AbortController().signal,
    );
    expect(immediate.body).toBe("fallback");
    await expect(pending).resolves.toBeNull();
  });
});
