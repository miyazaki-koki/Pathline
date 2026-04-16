import { describe, expect, it, vi } from "vitest";
import { createTwoLayerProvider } from "./twoLayerProvider";
import { FlexibleCandidateProvider } from "../flexibleProvider";
import type { LanguageModelProvider } from "../llm/languageModelProvider";
import type { LanguageModelCapability } from "../llm/capability";
import type { Candidate } from "../candidate";

function mockLLM(body: string | null): LanguageModelProvider {
  return {
    generate: vi.fn().mockImplementation(async (req) => {
      if (body === null) return null;
      return {
        category: req.category,
        body: `LLM_OUTPUT: ${body}\n---\n${req.text}\n---`,
        hash: `llm:${req.category}:${body}`,
      } satisfies Candidate;
    }),
  };
}

const readilyCap: LanguageModelCapability = {
  detect: async () => "readily",
  cachedStatus: "readily",
};
const unavailableCap: LanguageModelCapability = {
  detect: async () => "unavailable",
  cachedStatus: "unavailable",
};

describe("TwoLayer integration: real FlexibleProvider + mock LLM (IT-501, task 7.1)", () => {
  it("「議事録を要約」 → immediate は FlexibleProvider 出力、pending は LLM モック出力", async () => {
    const rule = new FlexibleCandidateProvider();
    const llm = mockLLM("summary preview");
    const provider = createTwoLayerProvider({
      rule,
      llm,
      capability: readilyCap,
      getLLMSetting: () => "auto",
    });

    const text = "議事録を要約してほしい。";
    const { immediate, pending } = provider.provide(
      { category: "summarize", text },
      new AbortController().signal,
    );

    expect(immediate.body).toContain(text);
    expect(immediate.body.length).toBeGreaterThan(text.length);

    const llmCandidate = await pending;
    expect(llmCandidate).not.toBeNull();
    expect(llmCandidate!.body).toContain("summary preview");
    expect(llmCandidate!.body).toContain(text);
  });

  it("同入力で 2 回 provide → immediate は決定論、pending の signal は別インスタンス", async () => {
    const rule = new FlexibleCandidateProvider();
    const llm = mockLLM("output");
    const provider = createTwoLayerProvider({
      rule,
      llm,
      capability: readilyCap,
      getLLMSetting: () => "auto",
    });
    const req = { category: "improve" as const, text: "この文章を改善してほしい。" };
    const ac1 = new AbortController();
    const ac2 = new AbortController();
    const a = provider.provide(req, ac1.signal);
    const b = provider.provide(req, ac2.signal);
    expect(a.immediate.body).toBe(b.immediate.body);
    await Promise.all([a.pending, b.pending]);
    expect(llm.generate).toHaveBeenCalledTimes(2);
    expect(vi.mocked(llm.generate).mock.calls[0][1]).toBe(ac1.signal);
    expect(vi.mocked(llm.generate).mock.calls[1][1]).toBe(ac2.signal);
  });
});

describe("TwoLayer llm=off / capability=unavailable (IT-503, task 7.3)", () => {
  it("llm=off → pending null、LLM.generate は呼ばれない", async () => {
    const rule = new FlexibleCandidateProvider();
    const llm = mockLLM("unused");
    const provider = createTwoLayerProvider({
      rule,
      llm,
      capability: readilyCap,
      getLLMSetting: () => "off",
    });
    const { immediate, pending } = provider.provide(
      { category: "summarize", text: "議事録を要約。" },
      new AbortController().signal,
    );
    expect(immediate.body).toContain("議事録を要約。");
    await expect(pending).resolves.toBeNull();
    expect(llm.generate).not.toHaveBeenCalled();
  });

  it("capability=unavailable → pending null、LLM.generate は呼ばれない", async () => {
    const rule = new FlexibleCandidateProvider();
    const llm = mockLLM("unused");
    const provider = createTwoLayerProvider({
      rule,
      llm,
      capability: unavailableCap,
      getLLMSetting: () => "auto",
    });
    const { pending } = provider.provide(
      { category: "summarize", text: "議事録を要約。" },
      new AbortController().signal,
    );
    await expect(pending).resolves.toBeNull();
    expect(llm.generate).not.toHaveBeenCalled();
  });
});
