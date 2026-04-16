export type PromptLang = "ja" | "en" | "other";

const HIRAGANA = /[\u3040-\u309F]/g;
const KATAKANA = /[\u30A0-\u30FF]/g;
const LATIN = /[A-Za-z]/g;

export function detectLanguage(text: string): PromptLang {
  if (text.length === 0) return "other";

  const hira = (text.match(HIRAGANA) ?? []).length;
  const kata = (text.match(KATAKANA) ?? []).length;
  const latin = (text.match(LATIN) ?? []).length;
  const jp = hira + kata;

  if (jp === 0 && latin === 0) return "other";
  if (jp > 0) return jp >= latin ? "ja" : "en";
  return latin > 0 ? "en" : "other";
}
