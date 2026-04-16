import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createController } from "./controller";
import type { TwoLayerCandidate, TwoLayerCandidateProvider } from "../core/twoLayer/twoLayerProvider";
import type { Candidate } from "../core/candidate";
import type { SettingsStore, Settings } from "../settings/settingsStore";
import type { Disposable } from "../dom/types";

const DEBOUNCE = 160;

async function flush(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 4; i++) await Promise.resolve();
}

function mockSettings(s: Settings): SettingsStore & {
  triggerChange: (next: Settings) => void;
} {
  let current = s;
  const listeners: Array<(s: Settings) => void> = [];
  return {
    load: async () => current,
    onChange: (cb: (s: Settings) => void): Disposable => {
      listeners.push(cb);
      return { dispose: () => undefined };
    },
    triggerChange(next) {
      current = next;
      for (const cb of listeners) cb(next);
    },
  };
}

interface PendingControl {
  resolve: (c: Candidate | null) => void;
  signal: AbortSignal;
}

function controllablePending(): { promise: Promise<Candidate | null>; control: Partial<PendingControl> } {
  const control: Partial<PendingControl> = {};
  const promise = new Promise<Candidate | null>((res) => {
    control.resolve = res;
  });
  return { promise, control };
}

function twoLayerWithControl(options?: {
  ruleBody?: string;
  llmBody?: string | null;
  manual?: boolean;
}): TwoLayerCandidateProvider & { pendings: PendingControl[] } {
  const ruleBody = options?.ruleBody ?? "RULE";
  const llmBody = options?.llmBody;
  const manual = options?.manual ?? false;
  const pendings: PendingControl[] = [];

  return {
    pendings,
    provide: (req, signal): TwoLayerCandidate => {
      const immediate: Candidate = {
        category: req.category,
        body: `${ruleBody}:${req.category}:${req.text}`,
        hash: `rulehash:${req.category}:${req.text}`,
      };
      if (manual) {
        const { promise, control } = controllablePending();
        pendings.push({ resolve: control.resolve!, signal });
        return { immediate, pending: promise };
      }
      const pending: Promise<Candidate | null> = Promise.resolve(
        llmBody === null || llmBody === undefined
          ? null
          : {
              category: req.category,
              body: `${llmBody}:${req.category}:${req.text}`,
              hash: `llmhash:${req.category}:${req.text}`,
            },
      );
      return { immediate, pending };
    },
  };
}

describe("Controller two-layer rendering (task 6.1)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("pending 解決 (LLM 成功) → 2 回 render (immediate → LLM)", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const tl = twoLayerWithControl({ ruleBody: "R", llmBody: "L" });
    const c = createController({ twoLayer: tl, settings: mockSettings({ mode: "flexible", llm: "auto" }) });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "議事録を要約してほしい";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    await flushMicrotasks();
    const overlay = document.querySelector(".pl-ghost-overlay");
    expect(overlay?.textContent).toContain("L:");
    c.teardown();
  });

  it("pending が null → immediate のみ描画", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const tl = twoLayerWithControl({ ruleBody: "R", llmBody: null });
    const c = createController({ twoLayer: tl, settings: mockSettings({ mode: "flexible", llm: "auto" }) });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "議事録を要約してほしい";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    await flushMicrotasks();
    const overlay = document.querySelector(".pl-ghost-overlay");
    expect(overlay?.textContent).toContain("R:");
    expect(overlay?.textContent).not.toContain("L:");
    c.teardown();
  });
});

describe("Controller pending abort (task 6.2)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("連続入力で前の pending が abort される", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const tl = twoLayerWithControl({ manual: true });
    const c = createController({ twoLayer: tl, settings: mockSettings({ mode: "flexible", llm: "auto" }) });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "議事録を要約してほしい";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    ta.value = "議事録を要約してほしい。";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    expect(tl.pendings.length).toBeGreaterThanOrEqual(2);
    expect(tl.pendings[0].signal.aborted).toBe(true);
    c.teardown();
  });

  it("blur で pending が abort される", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const tl = twoLayerWithControl({ manual: true });
    const c = createController({ twoLayer: tl, settings: mockSettings({ mode: "flexible", llm: "auto" }) });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "議事録を要約してほしい";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    ta.dispatchEvent(new FocusEvent("blur"));
    expect(tl.pendings[0].signal.aborted).toBe(true);
    c.teardown();
  });

  it("Esc で pending が abort される", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const tl = twoLayerWithControl({ manual: true });
    const c = createController({ twoLayer: tl, settings: mockSettings({ mode: "flexible", llm: "auto" }) });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "議事録を要約してほしい";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    expect(tl.pendings[0].signal.aborted).toBe(true);
    c.teardown();
  });

  it("cycle (ArrowDown) で前の pending を abort し新カテゴリで再起動", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const tl = twoLayerWithControl({ manual: true });
    const c = createController({ twoLayer: tl, settings: mockSettings({ mode: "flexible", llm: "auto" }) });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "議事録を要約してほしい";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    expect(tl.pendings.length).toBe(2);
    expect(tl.pendings[0].signal.aborted).toBe(true);
    expect(tl.pendings[1].signal.aborted).toBe(false);
    c.teardown();
  });
});

describe("Controller commit uses visibleCandidate (task 6.3)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("LLM 差替え後 Tab → setText は LLM body で呼ばれる", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const tl = twoLayerWithControl({ ruleBody: "R", llmBody: "L" });
    const c = createController({ twoLayer: tl, settings: mockSettings({ mode: "flexible", llm: "auto" }) });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "議事録を要約してほしい";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    await flushMicrotasks();
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(ta.value.startsWith("L:")).toBe(true);
    c.teardown();
  });

  it("LLM 差替え前 Tab → setText は immediate body で呼ばれる", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const tl = twoLayerWithControl({ manual: true });
    const c = createController({ twoLayer: tl, settings: mockSettings({ mode: "flexible", llm: "auto" }) });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "議事録を要約してほしい";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(ta.value.startsWith("RULE:")).toBe(true);
    expect(tl.pendings[0].signal.aborted).toBe(true);
    c.teardown();
  });
});

describe("Controller llm setting reactions (task 6.4)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("llm=auto → off onChange で進行中 pending が abort", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const tl = twoLayerWithControl({ manual: true });
    const settings = mockSettings({ mode: "flexible", llm: "auto" });
    const c = createController({ twoLayer: tl, settings });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "議事録を要約してほしい";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    expect(tl.pendings[0].signal.aborted).toBe(false);
    settings.triggerChange({ mode: "flexible", llm: "off" });
    expect(tl.pendings[0].signal.aborted).toBe(true);
    c.teardown();
  });
});
