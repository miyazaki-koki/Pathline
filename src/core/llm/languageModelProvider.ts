import type { Candidate, CandidateRequest } from "../candidate";
import { fnv1a } from "../candidate";
import type { LanguageModelCapability } from "./capability";
import { detectLanguage } from "./languageDetector";
import { sanitize } from "./outputSanitizer";
import { userPrompt } from "./promptTemplates";
import type { SessionPool } from "./sessionPool";

const TIMEOUT_MS = 2000;

export interface LanguageModelProvider {
  generate(req: CandidateRequest, externalSignal?: AbortSignal): Promise<Candidate | null>;
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export function createLanguageModelProvider(
  capability: LanguageModelCapability,
  pool: SessionPool,
): LanguageModelProvider {
  return {
    async generate(req, externalSignal) {
      const status = await capability.detect();
      if (status !== "readily") return null;

      const lang = detectLanguage(req.text);
      const base = await pool.get(req.category);
      const derived = await base.clone();

      try {
        const signals: AbortSignal[] = [AbortSignal.timeout(TIMEOUT_MS)];
        if (externalSignal) signals.push(externalSignal);
        const signal = signals.length === 1 ? signals[0] : AbortSignal.any(signals);

        const raw = await derived.prompt(userPrompt(req.text), { signal });
        const result = sanitize(raw, req.text, lang);
        if (!result.accepted) return null;

        const body = result.body;
        return {
          category: req.category,
          body,
          hash: fnv1a(`${req.category}:${body}`),
        };
      } catch (err) {
        if (!isAbortError(err)) {
          console.warn("[pathline] llm generate failed:", (err as Error).message);
        }
        return null;
      } finally {
        derived.destroy();
      }
    },
  };
}
