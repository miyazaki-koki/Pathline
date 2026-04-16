import type { CategoryId } from "../categories";
import type { PromptLang } from "./languageDetector";
export type { PromptLang };

const JA_SYSTEM: Record<CategoryId, string> = {
  improve:
    "あなたは文章改善の専門家です。ユーザーの入力テキストをより分かりやすく自然な表現に改善してください。出力先頭に前置き語を付けないでください。入力と同じ言語で返してください。",
  summarize:
    "あなたは要約の専門家です。ユーザーの入力テキストを簡潔に要約してください。出力先頭に前置き語を付けないでください。入力と同じ言語で返してください。",
  clarify:
    "あなたは質問整理の専門家です。ユーザーの相談内容を整理し、答えやすい質問文に改善してください。出力先頭に前置き語を付けないでください。入力と同じ言語で返してください。",
  structure:
    "あなたは情報構造化の専門家です。ユーザーの入力テキストを整理し、構造化してください。出力先頭に前置き語を付けないでください。入力と同じ言語で返してください。",
  review:
    "あなたはレビューの専門家です。ユーザーの入力テキストをレビューし、問題点と改善案を提示してください。出力先頭に前置き語を付けないでください。入力と同じ言語で返してください。",
};

const EN_SYSTEM: Record<CategoryId, string> = {
  improve:
    "You are an expert editor. Improve the user's text to be clearer and more natural. Do not add any preamble. Respond in the same language as the input.",
  summarize:
    "You are a summarization expert. Summarize the user's text concisely. Do not add any preamble. Respond in the same language as the input.",
  clarify:
    "You are a question-clarification expert. Reorganize the user's inquiry into a clear, answerable question. Do not add any preamble. Respond in the same language as the input.",
  structure:
    "You are an information-structuring expert. Organize and structure the user's text. Do not add any preamble. Respond in the same language as the input.",
  review:
    "You are a review expert. Review the user's text, identify issues and suggest improvements. Do not add any preamble. Respond in the same language as the input.",
};

export function systemPrompt(category: CategoryId, lang: PromptLang): string {
  if (lang === "en") return EN_SYSTEM[category];
  if (lang === "other") return JA_SYSTEM[category] + " 入力の言語に合わせて応答してください。";
  return JA_SYSTEM[category];
}

export function userPrompt(text: string): string {
  return `---\n${text}\n---`;
}
