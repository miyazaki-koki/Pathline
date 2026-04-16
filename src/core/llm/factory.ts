import type { CategoryId } from "../categories";
import { createLanguageModelCapability, type LanguageModelCapability } from "./capability";
import {
  createSessionPool,
  type LanguageModelSession,
  type SessionPool,
} from "./sessionPool";
import {
  createLanguageModelProvider,
  type LanguageModelProvider,
} from "./languageModelProvider";
import { systemPrompt } from "./promptTemplates";

interface LanguageModelCreateOptions {
  initialPrompts?: ReadonlyArray<{ role: "system" | "user" | "assistant"; content: string }>;
  expectedInputs?: ReadonlyArray<{ type: "text"; languages: readonly string[] }>;
  expectedOutputs?: ReadonlyArray<{ type: "text"; languages: readonly string[] }>;
  signal?: AbortSignal;
}

interface LanguageModelAPI {
  create(options: LanguageModelCreateOptions): Promise<LanguageModelSession>;
}

function readLanguageModel(): LanguageModelAPI | undefined {
  return (globalThis as unknown as { LanguageModel?: LanguageModelAPI }).LanguageModel;
}

export interface LLMStack {
  readonly capability: LanguageModelCapability;
  readonly pool: SessionPool;
  readonly provider: LanguageModelProvider;
  dispose(): void;
}

export function createChromeLLMStack(): LLMStack {
  const capability = createLanguageModelCapability();
  const createBase = async (category: CategoryId): Promise<LanguageModelSession> => {
    const lm = readLanguageModel();
    if (!lm) throw new Error("LanguageModel global unavailable");
    return lm.create({
      initialPrompts: [{ role: "system", content: systemPrompt(category, "ja") }],
      expectedInputs: [{ type: "text", languages: ["en", "ja"] }],
      expectedOutputs: [{ type: "text", languages: ["en", "ja"] }],
    });
  };
  const pool = createSessionPool(createBase);
  const provider = createLanguageModelProvider(capability, pool);
  return {
    capability,
    pool,
    provider,
    dispose: () => pool.dispose(),
  };
}
