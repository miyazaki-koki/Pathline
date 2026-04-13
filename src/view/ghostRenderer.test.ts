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
    expect(overlay?.textContent).toBe("hello");
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
    const overlay = document.querySelector(".pl-ghost-overlay");
    expect(overlay?.querySelector("script")).toBeNull();
  });
});

describe("GhostRenderer (contenteditable inline)", () => {
  let div: HTMLDivElement;
  beforeEach(() => {
    document.body.innerHTML = "";
    div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    document.body.appendChild(div);
  });

  it("render で ghost span が末尾に 1 つ挿入される", () => {
    const r = createGhostRenderer();
    const t = createInputTarget(div);
    r.render(t, candidate("hi"));
    const spans = div.querySelectorAll("span.pl-ghost-inline");
    expect(spans.length).toBe(1);
    expect(spans[0]?.getAttribute("contenteditable")).toBe("false");
  });

  it("hide で ghost span が除去される", () => {
    const r = createGhostRenderer();
    const t = createInputTarget(div);
    r.render(t, candidate("hi"));
    r.hide(t);
    expect(div.querySelector("span.pl-ghost-inline")).toBeNull();
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
    expect(document.querySelector(".pl-ghost-overlay")?.textContent).toBe("b");
  });
});
