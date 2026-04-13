import type { Candidate } from "../core/candidate";
import type { InputTarget } from "../dom/types";

export interface GhostRenderer {
  render(target: InputTarget, candidate: Candidate): void;
  hide(target: InputTarget): void;
  isVisible(target: InputTarget): boolean;
}

interface GhostState {
  readonly node: HTMLElement;
  hash: string;
}

const OVERLAY_CLASS = "pl-ghost-overlay";
const INLINE_CLASS = "pl-ghost-inline";

function createOverlay(target: InputTarget): HTMLElement {
  const el = document.createElement("div");
  el.className = OVERLAY_CLASS;
  el.setAttribute("aria-hidden", "true");
  el.style.position = "absolute";
  el.style.pointerEvents = "none";
  el.style.userSelect = "none";
  el.style.opacity = "0.45";
  el.style.whiteSpace = "pre-wrap";
  el.style.zIndex = "2147483647";
  el.style.color = "#666";
  positionOverlay(el, target.element);
  document.body.appendChild(el);
  return el;
}

function positionOverlay(overlay: HTMLElement, host: HTMLElement): void {
  const rect = host.getBoundingClientRect();
  const cs = window.getComputedStyle(host);
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.font = cs.font;
  overlay.style.padding = cs.padding;
  overlay.style.lineHeight = cs.lineHeight;
  overlay.style.boxSizing = cs.boxSizing;
}

function createInline(host: HTMLElement): HTMLElement {
  const span = document.createElement("span");
  span.className = INLINE_CLASS;
  span.setAttribute("contenteditable", "false");
  span.setAttribute("aria-hidden", "true");
  span.style.opacity = "0.45";
  span.style.color = "#666";
  span.style.userSelect = "none";
  host.appendChild(span);
  return span;
}

export function createGhostRenderer(): GhostRenderer {
  const states = new WeakMap<HTMLElement, GhostState>();

  const mount = (target: InputTarget): HTMLElement => {
    if (target.kind === "textarea") return createOverlay(target);
    return createInline(target.element);
  };

  return {
    render(target, candidate): void {
      const existing = states.get(target.element);
      if (existing && existing.hash === candidate.hash) return;
      if (existing) existing.node.remove();
      const node = mount(target);
      node.textContent = candidate.body;
      states.set(target.element, { node, hash: candidate.hash });
    },
    hide(target): void {
      const s = states.get(target.element);
      if (!s) return;
      s.node.remove();
      states.delete(target.element);
    },
    isVisible(target): boolean {
      return states.has(target.element);
    },
  };
}
