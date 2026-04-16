import {
  CASUAL_MARKERS,
  CODE_KEYWORDS,
  CODE_SYMBOL_PATTERN,
  CONCISE_MARKERS,
  CONCISE_PATTERNS,
  DETAILED_MARKERS,
  FOCUS_PATTERNS,
  FORMAL_MARKERS,
  FORMAT_RULES,
  QUESTION_MARKERS,
  TARGET_KEYWORDS,
  TONE_CASUAL_THRESHOLD,
  TONE_FORMAL_THRESHOLD,
} from "./dictionary";
import {
  EMPTY_FEATURES,
  MAX_FOCUS_COUNT,
  MAX_FOCUS_LEN,
  MAX_TEXT_LENGTH,
  MIN_FOCUS_LEN,
  MIN_TEXT_LENGTH,
  type FeatureExtractor,
  type Features,
  type LengthHint,
  type OutputFormat,
  type TargetKind,
  type Tone,
} from "./types";

function detectTarget(text: string): TargetKind {
  for (const { kind, words } of TARGET_KEYWORDS) {
    for (const w of words) if (text.includes(w)) return kind;
  }
  const codeHits = CODE_KEYWORDS.filter((w) => text.includes(w)).length;
  if (codeHits > 0 || CODE_SYMBOL_PATTERN.test(text)) return "code";
  if (QUESTION_MARKERS.some((m) => text.includes(m))) return "question";
  return "prose";
}

function countOccurrences(text: string, needles: readonly string[]): number {
  let n = 0;
  for (const w of needles) {
    let idx = 0;
    while ((idx = text.indexOf(w, idx)) !== -1) {
      n += 1;
      idx += w.length;
    }
  }
  return n;
}

function detectTone(text: string): Tone {
  const casual = countOccurrences(text, CASUAL_MARKERS);
  if (casual >= TONE_CASUAL_THRESHOLD) return "casual";
  const formal = countOccurrences(text, FORMAL_MARKERS);
  if (formal >= TONE_FORMAL_THRESHOLD) return "formal";
  return "neutral";
}

function detectFormat(text: string): OutputFormat {
  for (const { format, words } of FORMAT_RULES) {
    for (const w of words) if (text.includes(w)) return format;
  }
  return "unknown";
}

function detectLength(text: string): LengthHint {
  for (const w of CONCISE_MARKERS) if (text.includes(w)) return "concise";
  for (const p of CONCISE_PATTERNS) if (p.test(text)) return "concise";
  for (const w of DETAILED_MARKERS) if (text.includes(w)) return "detailed";
  return "unspecified";
}

function extractFocus(text: string): readonly string[] {
  const counts = new Map<string, number>();
  for (const pattern of FOCUS_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const raw = m[1] ?? m[0];
      const word = raw.trim();
      if (word.length < MIN_FOCUS_LEN || word.length > MAX_FOCUS_LEN) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_FOCUS_COUNT)
    .map(([w]) => w);
}

export class RuleBasedFeatureExtractor implements FeatureExtractor {
  extract(text: string): Features {
    if (text.length < MIN_TEXT_LENGTH) return EMPTY_FEATURES;
    const sliced = text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;
    return {
      target: detectTarget(sliced),
      tone: detectTone(sliced),
      format: detectFormat(sliced),
      length: detectLength(sliced),
      focus: extractFocus(sliced),
      empty: false,
    };
  }
}
