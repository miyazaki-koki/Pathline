import { describe, expect, it } from "vitest";
import { createStateMachine } from "./stateMachine";
import type { ScoreVector } from "./scoring";
import type { CategoryId } from "./categories";

function vec(
  top: CategoryId,
  scores: Partial<Record<CategoryId, number>>,
  explicit = false,
): ScoreVector {
  return {
    improve: 0,
    summarize: 0,
    clarify: 0,
    structure: 0,
    review: 0,
    ...scores,
    explicit,
    topCategory: top,
  };
}

describe("CategoryStateMachine", () => {
  it("初期状態で vec.topCategory を採用", () => {
    const sm = createStateMachine();
    expect(sm.reduce(vec("summarize", { summarize: 3 }))).toBe("summarize");
  });

  it("スコア差 >=2 で切替", () => {
    const sm = createStateMachine();
    sm.reduce(vec("improve", { improve: 2 }));
    const next = sm.reduce(vec("summarize", { summarize: 5, improve: 2 }));
    expect(next).toBe("summarize");
  });

  it("2 連続で challenger 優勢なら切替", () => {
    const sm = createStateMachine();
    sm.reduce(vec("improve", { improve: 3 }));
    // diff=1 で 1 回目: 維持
    sm.reduce(vec("summarize", { summarize: 4, improve: 3 }));
    expect(sm.current).toBe("improve");
    // 2 回目連続で切替
    const next = sm.reduce(vec("summarize", { summarize: 4, improve: 3 }));
    expect(next).toBe("summarize");
  });

  it("差<2 かつ 1 回のみは維持", () => {
    const sm = createStateMachine();
    sm.reduce(vec("improve", { improve: 3 }));
    const next = sm.reduce(vec("summarize", { summarize: 4, improve: 3 }));
    expect(next).toBe("improve");
  });

  it("explicit=true で即切替", () => {
    const sm = createStateMachine();
    sm.reduce(vec("improve", { improve: 3 }));
    const next = sm.reduce(vec("summarize", { summarize: 5 }, true));
    expect(next).toBe("summarize");
  });

  it("cycle(+1) で次カテゴリへ", () => {
    const sm = createStateMachine();
    sm.reduce(vec("improve", { improve: 1 }));
    expect(sm.cycle(1)).toBe("summarize");
    expect(sm.cycle(1)).toBe("clarify");
  });

  it("cycle(-1) は末尾から先頭へ循環", () => {
    const sm = createStateMachine();
    sm.reduce(vec("improve", { improve: 1 }));
    expect(sm.cycle(-1)).toBe("review");
  });

  it("manualLock 中は自動切替が発生しない", () => {
    const sm = createStateMachine();
    sm.reduce(vec("improve", { improve: 1 }));
    sm.cycle(1); // -> summarize, manualLock 立つ
    const next = sm.reduce(vec("review", { review: 10, summarize: 0 }));
    expect(next).toBe("summarize");
  });

  it("explicit 入力で manualLock が解除される", () => {
    const sm = createStateMachine();
    sm.reduce(vec("improve", { improve: 1 }));
    sm.cycle(1); // -> summarize (locked)
    const next = sm.reduce(vec("review", { review: 5 }, true));
    expect(next).toBe("review");
  });
});
