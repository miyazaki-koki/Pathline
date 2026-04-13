import { createInputTarget } from "./inputAdapter";
import type { Disposable, InputTarget } from "./types";

export interface DomWatcher {
  start(): void;
  stop(): void;
  onAttach(listener: (target: InputTarget) => void): Disposable;
  onDetach(listener: (target: InputTarget) => void): Disposable;
}

const SELECTOR = "textarea, [contenteditable='true'], [contenteditable='']";

function isEligible(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (el.getAttribute("data-pathline") === "off") return false;
  if (el.closest('[aria-hidden="true"]')) return false;
  if (el instanceof HTMLInputElement && el.type === "password") return false;
  if (el instanceof HTMLTextAreaElement) return true;
  const ce = el.getAttribute("contenteditable");
  return ce === "true" || ce === "";
}

export function createDomWatcher(): DomWatcher {
  const attached = new WeakMap<HTMLElement, InputTarget>();
  const attachListeners = new Set<(t: InputTarget) => void>();
  const detachListeners = new Set<(t: InputTarget) => void>();
  let observer: MutationObserver | null = null;

  const attach = (el: HTMLElement): void => {
    if (attached.has(el)) return;
    if (!isEligible(el)) return;
    const target = createInputTarget(el);
    attached.set(el, target);
    el.setAttribute("data-pl-attached", "1");
    for (const l of attachListeners) l(target);
  };

  const detach = (el: HTMLElement): void => {
    const target = attached.get(el);
    if (!target) return;
    attached.delete(el);
    el.removeAttribute("data-pl-attached");
    for (const l of detachListeners) l(target);
  };

  const scan = (root: ParentNode): void => {
    root.querySelectorAll(SELECTOR).forEach((el) => {
      if (el instanceof HTMLElement) attach(el);
    });
    if (root instanceof HTMLElement && root.matches(SELECTOR)) attach(root);
  };

  return {
    start(): void {
      if (observer) return;
      scan(document);
      observer = new MutationObserver((records) => {
        for (const r of records) {
          r.addedNodes.forEach((n) => {
            if (n instanceof HTMLElement) scan(n);
          });
          r.removedNodes.forEach((n) => {
            if (n instanceof HTMLElement) {
              if (n.matches(SELECTOR)) detach(n);
              n.querySelectorAll("[data-pl-attached='1']").forEach((el) => {
                if (el instanceof HTMLElement) detach(el);
              });
            }
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    },
    stop(): void {
      observer?.disconnect();
      observer = null;
    },
    onAttach(listener) {
      attachListeners.add(listener);
      return { dispose: () => attachListeners.delete(listener) };
    },
    onDetach(listener) {
      detachListeners.add(listener);
      return { dispose: () => detachListeners.delete(listener) };
    },
  };
}
