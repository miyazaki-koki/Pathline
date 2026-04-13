import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createController } from "./controller";

const DEBOUNCE = 160;

async function flush(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

describe("PathlineController", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("4 文字以上入力で debounce 後に ghost が表示される", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const c = createController();
    c.bootstrap();
    ta.value = "hello world";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    expect(document.querySelector(".pl-ghost-overlay")).not.toBeNull();
    c.teardown();
  });

  it("3 文字未満では ghost が表示されない", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const c = createController();
    c.bootstrap();
    ta.value = "ab";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    expect(document.querySelector(".pl-ghost-overlay")).toBeNull();
    c.teardown();
  });

  it("blur で ghost が消える", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const c = createController();
    c.bootstrap();
    ta.value = "hello world";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    ta.dispatchEvent(new FocusEvent("blur"));
    expect(document.querySelector(".pl-ghost-overlay")).toBeNull();
    c.teardown();
  });

  it("Tab で candidate が textarea.value に反映される", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const c = createController();
    c.bootstrap();
    ta.value = "これを要約して";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(ta.value).toContain("要約");
    expect(ta.value).toContain("---");
    c.teardown();
  });

  it("Esc 後、同一入力では再表示されない", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const c = createController();
    c.bootstrap();
    ta.value = "hello world";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    expect(document.querySelector(".pl-ghost-overlay")).toBeNull();
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    expect(document.querySelector(".pl-ghost-overlay")).toBeNull();
    c.teardown();
  });

  it("text が変わると Esc 抑制は解除される", async () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const c = createController();
    c.bootstrap();
    ta.value = "hello world";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    ta.value = "hello world!";
    ta.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    expect(document.querySelector(".pl-ghost-overlay")).not.toBeNull();
    c.teardown();
  });

  it("2 つの入力欄で独立した状態", async () => {
    const a = document.createElement("textarea");
    const b = document.createElement("textarea");
    document.body.appendChild(a);
    document.body.appendChild(b);
    const c = createController();
    c.bootstrap();
    a.value = "hello world";
    a.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    expect(document.querySelectorAll(".pl-ghost-overlay").length).toBe(1);
    b.value = "これを要約して";
    b.dispatchEvent(new Event("input"));
    await flush(DEBOUNCE);
    expect(document.querySelectorAll(".pl-ghost-overlay").length).toBe(2);
    c.teardown();
  });
});
