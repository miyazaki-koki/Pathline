import { describe, expect, it, beforeEach } from "vitest";
import { createKeyboardHandler, type KeyAction } from "./keyboardHandler";

describe("KeyboardHandler", () => {
  let el: HTMLTextAreaElement;
  beforeEach(() => {
    document.body.innerHTML = "";
    el = document.createElement("textarea");
    document.body.appendChild(el);
  });

  function dispatch(type: string, init: KeyboardEventInit & { isComposing?: boolean } = {}): KeyboardEvent {
    const ev = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
    if (init.isComposing) {
      Object.defineProperty(ev, "isComposing", { value: true });
    }
    el.dispatchEvent(ev);
    return ev;
  }

  it("visible=true で Tab → commit & preventDefault", () => {
    const actions: KeyAction[] = [];
    const h = createKeyboardHandler(() => true);
    h.onAction((a) => actions.push(a));
    h.attach(el);
    const ev = dispatch("keydown", { key: "Tab" });
    expect(actions).toEqual([{ type: "commit" }]);
    expect(ev.defaultPrevented).toBe(true);
  });

  it("visible=false で Tab はネイティブ動作", () => {
    const actions: KeyAction[] = [];
    const h = createKeyboardHandler(() => false);
    h.onAction((a) => actions.push(a));
    h.attach(el);
    const ev = dispatch("keydown", { key: "Tab" });
    expect(actions.length).toBe(0);
    expect(ev.defaultPrevented).toBe(false);
  });

  it("ArrowDown → cycle(+1)", () => {
    const actions: KeyAction[] = [];
    const h = createKeyboardHandler(() => true);
    h.onAction((a) => actions.push(a));
    h.attach(el);
    dispatch("keydown", { key: "ArrowDown" });
    expect(actions).toEqual([{ type: "cycle", direction: 1 }]);
  });

  it("ArrowUp → cycle(-1)", () => {
    const actions: KeyAction[] = [];
    const h = createKeyboardHandler(() => true);
    h.onAction((a) => actions.push(a));
    h.attach(el);
    dispatch("keydown", { key: "ArrowUp" });
    expect(actions).toEqual([{ type: "cycle", direction: -1 }]);
  });

  it("Esc → dismiss", () => {
    const actions: KeyAction[] = [];
    const h = createKeyboardHandler(() => true);
    h.onAction((a) => actions.push(a));
    h.attach(el);
    dispatch("keydown", { key: "Escape" });
    expect(actions).toEqual([{ type: "dismiss" }]);
  });

  it("IME 変換中は何もしない", () => {
    const actions: KeyAction[] = [];
    const h = createKeyboardHandler(() => true);
    h.onAction((a) => actions.push(a));
    h.attach(el);
    const ev = dispatch("keydown", { key: "Tab", isComposing: true });
    expect(actions.length).toBe(0);
    expect(ev.defaultPrevented).toBe(false);
  });

  it("非対象キーはパススルー", () => {
    const actions: KeyAction[] = [];
    const h = createKeyboardHandler(() => true);
    h.onAction((a) => actions.push(a));
    h.attach(el);
    const ev = dispatch("keydown", { key: "a" });
    expect(actions.length).toBe(0);
    expect(ev.defaultPrevented).toBe(false);
  });
});
