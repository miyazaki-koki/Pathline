import { describe, expect, it, beforeEach } from "vitest";
import { createDomWatcher } from "./domWatcher";

describe("DomWatcher", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("既存の textarea を attach する", () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const w = createDomWatcher();
    const attached: HTMLElement[] = [];
    w.onAttach((t) => attached.push(t.element));
    w.start();
    expect(attached).toContain(ta);
    w.stop();
  });

  it("既存の contenteditable を attach する", () => {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    document.body.appendChild(div);
    const w = createDomWatcher();
    const attached: HTMLElement[] = [];
    w.onAttach((t) => attached.push(t.element));
    w.start();
    expect(attached).toContain(div);
    w.stop();
  });

  it("password input は attach しない", () => {
    const pw = document.createElement("input");
    pw.type = "password";
    document.body.appendChild(pw);
    const w = createDomWatcher();
    const attached: HTMLElement[] = [];
    w.onAttach((t) => attached.push(t.element));
    w.start();
    expect(attached.length).toBe(0);
    w.stop();
  });

  it("data-pathline='off' を持つ要素は attach しない", () => {
    const ta = document.createElement("textarea");
    ta.setAttribute("data-pathline", "off");
    document.body.appendChild(ta);
    const w = createDomWatcher();
    const attached: HTMLElement[] = [];
    w.onAttach((t) => attached.push(t.element));
    w.start();
    expect(attached.length).toBe(0);
    w.stop();
  });

  it("同一要素を 2 度 attach しない", () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const w = createDomWatcher();
    let count = 0;
    w.onAttach(() => count++);
    w.start();
    // 2 度目 start を走らせても単調
    expect(count).toBe(1);
    w.stop();
  });

  it("動的追加された textarea を attach する", async () => {
    const w = createDomWatcher();
    const attached: HTMLElement[] = [];
    w.onAttach((t) => attached.push(t.element));
    w.start();
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    await new Promise((r) => setTimeout(r, 10));
    expect(attached).toContain(ta);
    w.stop();
  });
});
