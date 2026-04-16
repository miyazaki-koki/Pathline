export const AVAILABILITY_STATUSES = [
  "readily",
  "after-download",
  "downloading",
  "unavailable",
] as const;

export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export interface CapabilityOptions {
  readonly inputLanguages: readonly string[];
  readonly outputLanguages: readonly string[];
}

export const DEFAULT_CAPABILITY_OPTIONS: CapabilityOptions = {
  inputLanguages: ["ja", "en"],
  outputLanguages: ["ja", "en"],
};

interface LanguageModelGlobal {
  availability(options?: CapabilityOptions): Promise<string>;
}

function readGlobal(): LanguageModelGlobal | undefined {
  const g = globalThis as unknown as { LanguageModel?: LanguageModelGlobal };
  return g.LanguageModel;
}

function normalize(raw: string): AvailabilityStatus {
  return (AVAILABILITY_STATUSES as readonly string[]).includes(raw)
    ? (raw as AvailabilityStatus)
    : "unavailable";
}

export interface LanguageModelCapability {
  detect(options?: CapabilityOptions): Promise<AvailabilityStatus>;
  readonly cachedStatus: AvailabilityStatus | null;
}

export function createLanguageModelCapability(): LanguageModelCapability {
  let cached: AvailabilityStatus | null = null;
  let warned = false;

  return {
    get cachedStatus() {
      return cached;
    },
    async detect(options = DEFAULT_CAPABILITY_OPTIONS): Promise<AvailabilityStatus> {
      if (cached !== null) return cached;
      const lm = readGlobal();
      if (!lm) {
        cached = "unavailable";
        return cached;
      }
      try {
        const raw = await lm.availability(options);
        cached = normalize(raw);
      } catch (err) {
        if (!warned) {
          console.warn("[pathline] llm capability detection failed:", (err as Error).message);
          warned = true;
        }
        cached = "unavailable";
      }
      return cached;
    },
  };
}
