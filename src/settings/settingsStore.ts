import type { Disposable } from "../dom/types";

export type Mode = "flexible" | "classic";
const DEFAULT_MODE: Mode = "flexible";
const KEY = "mode";

function isMode(v: unknown): v is Mode {
  return v === "flexible" || v === "classic";
}

export interface SettingsStore {
  load(): Promise<{ mode: Mode }>;
  onChange(listener: (mode: Mode) => void): Disposable;
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
  return {
    async load() {
      try {
        const storage = typeof chrome !== "undefined" ? chrome.storage?.local : undefined;
        if (!storage) return { mode: DEFAULT_MODE };
        const res = await storage.get(KEY);
        const raw = res[KEY];
        return { mode: isMode(raw) ? raw : DEFAULT_MODE };
      } catch {
        return { mode: DEFAULT_MODE };
      }
    },
    onChange(listener) {
      const onChanged = typeof chrome !== "undefined" ? chrome.storage?.onChanged : undefined;
      if (!onChanged) return { dispose: () => undefined };
      const handler = (changes: Record<string, { newValue?: unknown }>, area: string): void => {
        if (area !== "local") return;
        const change = changes[KEY];
        if (!change) return;
        listener(isMode(change.newValue) ? change.newValue : DEFAULT_MODE);
      };
      onChanged.addListener(handler);
      return { dispose: () => onChanged.removeListener(handler) };
    },
  };
}
