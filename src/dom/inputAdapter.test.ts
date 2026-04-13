import { describe, expect, it, beforeEach } from "vitest";
import { createInputTarget } from "./inputAdapter";

describe("InputAdapter (textarea)", () => {
  let el: HTMLTextAreaElement;
  beforeEach(() => {
    document.body.innerHTML = "";
    el = document.createElement("textarea");
    document.body.appendChild(el);
  });

  it("getText/setText が往復する", () => {
    const t = createInputTarget(el);
    t.setText("hello");
    expect(t.getText()).toBe("hello");
  });

  it("setText 後に input イベントが発火", () => {
    const t = createInputTarget(el);
    let fired = 0;
    el.addEventListener("input", () => fired++);
    t.setText("abc");
    expect(fired).toBe(1);
  });

  it("onInput リスナーが発火", () => {
    const t = createInputTarget(el);
    let captured: string | null = null;
    t.onInput((text) => {
      captured = text;
    });
    el.value = "x";
    el.dispatchEvent(new Event("input"));
    expect(captured).toBe("x");
  });

  it("IME 変換中 (isComposing) は onInput を抑止", () => {
    const t = createInputTarget(el);
    let fired = 0;
    t.onInput(() => fired++);
    el.dispatchEvent(new CompositionEvent("compositionstart"));
    el.value = "へんかん";
    el.dispatchEvent(new Event("input"));
    expect(fired).toBe(0);
    el.dispatchEvent(new CompositionEvent("compositionend"));
    el.dispatchEvent(new Event("input"));
    expect(fired).toBe(1);
  });

  it("blur/focus リスナーが発火", () => {
    const t = createInputTarget(el);
    let blurs = 0;
    let focuses = 0;
    t.onBlur(() => blurs++);
    t.onFocus(() => focuses++);
    el.dispatchEvent(new FocusEvent("focus"));
    el.dispatchEvent(new FocusEvent("blur"));
    expect(focuses).toBe(1);
    expect(blurs).toBe(1);
  });

  it("kind は 'textarea'", () => {
    expect(createInputTarget(el).kind).toBe("textarea");
  });
});

describe("InputAdapter (contenteditable)", () => {
  let el: HTMLDivElement;
  beforeEach(() => {
    document.body.innerHTML = "";
    el = document.createElement("div");
    el.setAttribute("contenteditable", "true");
    document.body.appendChild(el);
  });

  it("getText/setText が往復する", () => {
    const t = createInputTarget(el);
    t.setText("hello");
    expect(t.getText()).toBe("hello");
  });

  it("kind は 'contenteditable'", () => {
    expect(createInputTarget(el).kind).toBe("contenteditable");
  });
});
