import type { Candidate, CandidateProvider, CandidateRequest } from "../candidate";
import type { LanguageModelCapability } from "../llm/capability";
import type { LanguageModelProvider } from "../llm/languageModelProvider";
import type { LLMSetting } from "../../settings/settingsStore";

export interface TwoLayerCandidate {
  readonly immediate: Candidate;
  readonly pending: Promise<Candidate | null>;
}

export interface TwoLayerProviderDeps {
  readonly rule: CandidateProvider;
  readonly llm: LanguageModelProvider;
  readonly capability: LanguageModelCapability;
  readonly getLLMSetting: () => LLMSetting;
}

export interface TwoLayerCandidateProvider {
  provide(req: CandidateRequest, signal: AbortSignal): TwoLayerCandidate;
}

export function createTwoLayerProvider(deps: TwoLayerProviderDeps): TwoLayerCandidateProvider {
  return {
    provide(req, signal) {
      const ruleResult = deps.rule.provide(req);
      const immediate = ruleResult instanceof Promise
        ? (() => {
            throw new Error("rule provider must be synchronous in TwoLayerCandidateProvider");
          })()
        : ruleResult;

      if (deps.getLLMSetting() === "off") {
        return { immediate, pending: Promise.resolve(null) };
      }

      const pending: Promise<Candidate | null> = (async () => {
        const status = await deps.capability.detect();
        if (status !== "readily") return null;
        try {
          return await deps.llm.generate(req, signal);
        } catch {
          return null;
        }
      })();

      return { immediate, pending };
    },
  };
}
