import { describe, expect, it, beforeEach } from "vitest";
import { createInputTarget } from "../dom/inputAdapter";
import { createGhostRenderer } from "./ghostRenderer";
import type { Candidate } from "../core/candidate";

const candidate = (body: string, hash = body): Candidate => ({
  category: "improve",
  body,
  hash,
});

describe("GhostRenderer (textarea overlay)", () => {
  let ta: HTMLTextAreaElement;
  beforeEach(() => {
    document.body.innerHTML = "";
    ta = document.createElement("textarea");
    document.body.appendChild(ta);
  });

  it("render で overlay 要素が挿入される", () => {
    const r = createGhostRenderer();
    const t = createInputTarget(ta);
    r.render(t, candidate("hello"));
    const overlay = document.querySelector(".pl-ghost-overlay");
    expect(overlay).not.toBeNull();
    expect(overlay?.querySelector(".pl-ghost-body")?.textContent).toBe("hello");
    expect(overlay?.getAttribute("aria-hidden")).toBe("true");
  });

  it("hide で overlay が除去される", () => {
    const r = createGhostRenderer();
    const t = createInputTarget(ta);
    r.render(t, candidate("hello"));
    r.hide(t);
    expect(document.querySelector(".pl-ghost-overlay")).toBeNull();
    expect(r.isVisible(t)).toBe(false);
  });

  it("textContent のみを使用 (innerHTML 未使用)", () => {
    const r = createGhostRenderer();
    const t = createInputTarget(ta);
    r.render(t, candidate("<script>x</script>"));
    const body = document.querySelector(".pl-ghost-overlay .pl-ghost-body");
    expect(body?.querySelector("script")).toBeNull();
    expect(body?.textContent).toBe("<script>x</script>");
  });
});

describe("GhostRenderer (contenteditable は overlay 統一)", () => {
  let div: HTMLDivElement;
  beforeEach(() => {
    document.body.innerHTML = "";
    div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    document.body.appendChild(div);
  });

  it("render で overlay が body に追加され、host textContent は汚染されない", () => {
    const r = createGhostRenderer();
    const t = createInputTarget(div);
    div.textContent = "user text";
    r.render(t, candidate("ghost body"));
    expect(document.querySelector(".pl-ghost-overlay")).not.toBeNull();
    expect(div.textContent).toBe("user text");
    expect(div.querySelector(".pl-ghost-overlay")).toBeNull();
  });

  it("hide で overlay が除去される", () => {
    const r = createGhostRenderer();
    const t = createInputTarget(div);
    r.render(t, candidate("hi"));
    r.hide(t);
    expect(document.querySelector(".pl-ghost-overlay")).toBeNull();
  });
});

describe("GhostRenderer (dirty check)", () => {
  it("同一 hash で 2 回 render しても置換されない", () => {
    document.body.innerHTML = "";
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const r = createGhostRenderer();
    const t = createInputTarget(ta);
    r.render(t, candidate("a", "H1"));
    const first = document.querySelector(".pl-ghost-overlay");
    r.render(t, candidate("a", "H1"));
    const second = document.querySelector(".pl-ghost-overlay");
    expect(second).toBe(first);
  });

  it("異なる hash だと新しい body に置換される", () => {
    document.body.innerHTML = "";
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    const r = createGhostRenderer();
    const t = createInputTarget(ta);
    r.render(t, candidate("a", "H1"));
    r.render(t, candidate("b", "H2"));
    expect(document.querySelector(".pl-ghost-overlay .pl-ghost-body")?.textContent).toBe("b");
  });
});
