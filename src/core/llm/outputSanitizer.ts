import type { PromptLang } from "./languageDetector";

export interface SanitizeResult {
  readonly body: string;
  readonly accepted: boolean;
}

const JA_PREAMBLE =
  /^(?:こちらが|以下が|以下は|以下の通り|こちらは|承知しました|かしこまりました)[^\n。：:]*[。：:\n]\s*/;
const EN_PREAMBLE =
  /^(?:Sure[,.]?\s*|Here (?:is|are)[^.\n]*[.:]\s*|Certainly[,.]?\s*|Of course[,.]?\s*)/i;

const JP_CHAR = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;

function stripPreamble(text: string): string {
  return text.replace(JA_PREAMBLE, "").replace(EN_PREAMBLE, "");
}

function hasFraming(body: string, originalText: string): boolean {
  return body.includes(`---\n${originalText}\n---`);
}

export function sanitize(
  llmOutput: string,
  originalText: string,
  inputLang: PromptLang,
): SanitizeResult {
  let body = stripPreamble(llmOutput).trim();

  if (inputLang === "ja" && !JP_CHAR.test(body)) {
    return { body, accepted: false };
  }

  if (!hasFraming(body, originalText)) {
    body = `${body}\n---\n${originalText}\n---`;
  }

  return { body, accepted: true };
}
