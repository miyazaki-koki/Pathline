export type TargetKind =
  | "code"
  | "prose"
  | "meeting_minutes"
  | "spec"
  | "proposal"
  | "question"
  | "unknown";

export type Tone = "formal" | "casual" | "neutral";

export type OutputFormat = "free" | "bullets" | "table" | "code" | "unknown";

export type LengthHint = "concise" | "detailed" | "unspecified";

export interface Features {
  readonly target: TargetKind;
  readonly tone: Tone;
  readonly format: OutputFormat;
  readonly length: LengthHint;
  readonly focus: readonly string[];
  readonly empty: boolean;
}

export const EMPTY_FEATURES: Features = Object.freeze({
  target: "unknown",
  tone: "neutral",
  format: "unknown",
  length: "unspecified",
  focus: Object.freeze<string[]>([]) as readonly string[],
  empty: true,
});

export interface FeatureExtractor {
  extract(text: string): Features;
}

export const MIN_TEXT_LENGTH = 4;
export const MAX_TEXT_LENGTH = 10_000;
export const MAX_FOCUS_COUNT = 3;
export const MIN_FOCUS_LEN = 4;
export const MAX_FOCUS_LEN = 16;
