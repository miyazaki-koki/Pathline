import type { Disposable } from "../dom/types";

export type Mode = "flexible" | "classic";
export type LLMSetting = "auto" | "off";

const DEFAULT_MODE: Mode = "flexible";
const DEFAULT_LLM: LLMSetting = "auto";
const MODE_KEY = "mode";
const LLM_KEY = "llm";

export interface Settings {
  readonly mode: Mode;
  readonly llm: LLMSetting;
}

function isMode(v: unknown): v is Mode {
  return v === "flexible" || v === "classic";
}
function isLLM(v: unknown): v is LLMSetting {
  return v === "auto" || v === "off";
}

export interface SettingsStore {
  load(): Promise<Settings>;
  onChange(listener: (s: Settings) => void): Disposable;
}

type ChromeStorageLocal = {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
};
type ChromeStorage = {
  local: ChromeStorageLocal;
  onChanged?: {
    addListener(cb: (changes: Record<string, { newValue?: unknown }>, area: string) => void): void;
    removeListener(cb: (changes: Record<string, { newValue?: unknown }>, area: string) => void): void;
  };
};

declare const chrome: { storage?: ChromeStorage } | undefined;

export function createSettingsStore(): SettingsStore {
  let current: Settings = { mode: DEFAULT_MODE, llm: DEFAULT_LLM };

  return {
    async load(): Promise<Settings> {
      try {
        const storage = typeof chrome !== "undefined" ? chrome.storage?.local : undefined;
        if (!storage) {
          current = { mode: DEFAULT_MODE, llm: DEFAULT_LLM };
          return current;
        }
        const res = await storage.get([MODE_KEY, LLM_KEY]);
        current = {
          mode: isMode(res[MODE_KEY]) ? res[MODE_KEY] : DEFAULT_MODE,
          llm: isLLM(res[LLM_KEY]) ? res[LLM_KEY] : DEFAULT_LLM,
        };
        return current;
      } catch {
        current = { mode: DEFAULT_MODE, llm: DEFAULT_LLM };
        return current;
      }
    },
    onChange(listener) {
      const onChanged = typeof chrome !== "undefined" ? chrome.storage?.onChanged : undefined;
      if (!onChanged) return { dispose: () => undefined };
      const handler = (changes: Record<string, { newValue?: unknown }>, area: string): void => {
        if (area !== "local") return;
        let touched = false;
        const next = { ...current };
        const modeChange = changes[MODE_KEY];
        if (modeChange) {
          next.mode = isMode(modeChange.newValue) ? modeChange.newValue : DEFAULT_MODE;
          touched = true;
        }
        const llmChange = changes[LLM_KEY];
        if (llmChange) {
          next.llm = isLLM(llmChange.newValue) ? llmChange.newValue : DEFAULT_LLM;
          touched = true;
        }
        if (!touched) return;
        current = next;
        listener(current);
      };
      onChanged.addListener(handler);
      return { dispose: () => onChanged.removeListener(handler) };
    },
  };
}
