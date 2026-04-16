import type { CategoryId } from "../categories";

export interface DerivedSession {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  destroy(): void;
}

export interface LanguageModelSession {
  clone(): Promise<DerivedSession>;
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  destroy(): void;
}

export type SessionFactory = (category: CategoryId, systemPrompt: string) => Promise<LanguageModelSession>;

export interface SessionPool {
  get(category: CategoryId): Promise<{ clone(): Promise<DerivedSession> }>;
  dispose(): void;
}

export function createSessionPool(create: (category: CategoryId) => Promise<LanguageModelSession>): SessionPool {
  const bases = new Map<CategoryId, Promise<LanguageModelSession>>();

  return {
    get(category) {
      let entry = bases.get(category);
      if (!entry) {
        entry = create(category);
        bases.set(category, entry);
      }
      return entry;
    },
    dispose() {
      for (const p of bases.values()) {
        p.then((s) => s.destroy()).catch(() => undefined);
      }
      bases.clear();
    },
  };
}
