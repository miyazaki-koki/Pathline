import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createController } from "./controller";
import { buildTemplate } from "../core/template";
import type { SettingsStore, Mode } from "../settings/settingsStore";
import type { Disposable } from "../dom/types";

const DEBOUNCE = 160;

function mockSettings(mode: Mode): SettingsStore {
  return {
    load: async () => ({ mode }),
    onChange: (): Disposable => ({ dispose: () => undefined }),
  };
}

async function flush(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("Controller + FlexibleProvider E2E (7.2)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("4 文字以上入力で FlexibleProvider 経由の ghost が描画される", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const c = createController({ settings: mockSettings("flexible") });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "議事録を要約してほしい。";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    const ghost = document.querySelector(".pl-ghost-overlay");
    expect(ghost).not.toBeNull();
    c.teardown();
  });

  it("Tab 確定で body が反映され ghost が消える", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const c = createController({ settings: mockSettings("flexible") });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "議事録を要約してほしい。";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(ta.value).toContain("---");
    expect(ta.value).toContain("議事録を要約してほしい。");
    expect(document.querySelector(".pl-ghost-overlay")).toBeNull();
    c.teardown();
  });

  it("ArrowDown で category が切り替わり新しい body が描画される", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const c = createController({ settings: mockSettings("flexible") });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "この設計をどうすべきか相談したい。";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    const before = document.querySelector(".pl-ghost-overlay")?.textContent ?? "";
    ta.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
    );
    const after = document.querySelector(".pl-ghost-overlay")?.textContent ?? "";
    expect(after).not.toBe("");
    expect(after).not.toBe(before);
    c.teardown();
  });

  it("Esc で消え、同一 text では再表示されない", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const c = createController({ settings: mockSettings("flexible") });
    c.bootstrap();
    await flushMicrotasks();
    ta.value = "議事録を要約してほしい。";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    ta.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    );
    expect(document.querySelector(".pl-ghost-overlay")).toBeNull();
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    expect(document.querySelector(".pl-ghost-overlay")).toBeNull();
    c.teardown();
  });
});

describe("Controller mode=classic (7.3)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("mode=classic で Tab 確定すると buildTemplate 出力と一致する", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const c = createController({ settings: mockSettings("classic") });
    c.bootstrap();
    await flushMicrotasks();
    const text = "これを要約してほしい。";
    ta.value = text;
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(ta.value).toBe(buildTemplate("summarize", text));
    c.teardown();
  });

  it("mode=flexible と mode=classic で同一入力の body が異なる", async () => {
    const text = "議事録を簡潔に要約してほしい。";

    const taA = document.createElement("textarea");
    document.body.appendChild(taA);
    const ca = createController({ settings: mockSettings("flexible") });
    ca.bootstrap();
    await flushMicrotasks();
    taA.value = text;
    taA.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    taA.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    const flexOut = taA.value;
    ca.teardown();
    document.body.innerHTML = "";

    const taB = document.createElement("textarea");
    document.body.appendChild(taB);
    const cb = createController({ settings: mockSettings("classic") });
    cb.bootstrap();
    await flushMicrotasks();
    taB.value = text;
    taB.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    taB.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    const classicOut = taB.value;
    cb.teardown();

    expect(classicOut).toBe(buildTemplate("summarize", text));
    expect(flexOut).not.toBe(classicOut);
  });
});
