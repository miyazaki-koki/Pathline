import { describe, expect, it } from "vitest";
import { EMPTY_FEATURES, MAX_FOCUS_COUNT } from "./types";

describe("Feature types", () => {
  it("EMPTY_FEATURES は empty=true と既定値を持つ", () => {
    expect(EMPTY_FEATURES.empty).toBe(true);
    expect(EMPTY_FEATURES.target).toBe("unknown");
    expect(EMPTY_FEATURES.tone).toBe("neutral");
    expect(EMPTY_FEATURES.format).toBe("unknown");
    expect(EMPTY_FEATURES.length).toBe("unspecified");
    expect(EMPTY_FEATURES.focus).toEqual([]);
  });

  it("MAX_FOCUS_COUNT は 3", () => {
    expect(MAX_FOCUS_COUNT).toBe(3);
  });
});
