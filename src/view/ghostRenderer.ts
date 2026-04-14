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

function makeKbd(label: string): HTMLElement {
  const k = document.createElement("kbd");
  k.style.cssText =
    "font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:1px 5px;border-radius:3px;font-size:10px;";
  k.textContent = label;
  return k;
}

function createOverlay(target: InputTarget): HTMLElement {
  const el = document.createElement("div");
  el.className = OVERLAY_CLASS;
  el.setAttribute("aria-hidden", "true");
  el.style.position = "absolute";
  el.style.pointerEvents = "none";
  el.style.userSelect = "none";
  el.style.zIndex = "2147483647";
  el.style.background = "#0f172a";
  el.style.color = "#e2e8f0";
  el.style.borderRadius = "10px";
  el.style.overflow = "hidden";
  el.style.font = "12px/1.55 system-ui, -apple-system, 'Segoe UI', sans-serif";
  el.style.boxShadow = "0 8px 24px rgba(15,23,42,0.28)";
  el.style.maxHeight = "260px";

  const head = document.createElement("div");
  head.className = "pl-ghost-head";
  head.style.cssText =
    "display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#1e293b;border-bottom:1px solid #334155;";

  const cat = document.createElement("span");
  cat.className = "pl-ghost-cat";
  cat.style.cssText =
    "font-weight:600;color:#a5b4fc;text-transform:uppercase;letter-spacing:0.06em;font-size:10px;";

  const keys = document.createElement("span");
  keys.style.cssText = "display:flex;gap:6px;font-size:10px;color:#94a3b8;align-items:center;";
  keys.appendChild(makeKbd("Tab"));
  keys.appendChild(makeKbd("↑↓"));
  keys.appendChild(makeKbd("Esc"));

  head.appendChild(cat);
  head.appendChild(keys);

  const body = document.createElement("div");
  body.className = "pl-ghost-body";
  body.style.cssText =
    "padding:12px;white-space:pre-wrap;line-height:1.55;max-height:200px;overflow:auto;";

  el.appendChild(head);
  el.appendChild(body);
  positionOverlay(el, target.element);
  document.body.appendChild(el);
  return el;
}

function positionOverlay(overlay: HTMLElement, host: HTMLElement): void {
  const rect = host.getBoundingClientRect();
  overlay.style.top = `${rect.bottom + window.scrollY + 4}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.width = `${Math.max(rect.width, 280)}px`;
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
    return createOverlay(target);
  };

  return {
    render(target, candidate): void {
      const existing = states.get(target.element);
      if (existing && existing.hash === candidate.hash) return;
      if (existing) existing.node.remove();
      const node = mount(target);
      const writeTarget = node.querySelector<HTMLElement>(".pl-ghost-body") ?? node;
      writeTarget.textContent = candidate.body;
      const catEl = node.querySelector<HTMLElement>(".pl-ghost-cat");
      if (catEl) catEl.textContent = candidate.category;
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
