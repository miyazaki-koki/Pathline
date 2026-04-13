import type { Disposable } from "../dom/types";

export type KeyAction =
  | { type: "commit" }
  | { type: "cycle"; direction: 1 | -1 }
  | { type: "dismiss" };

export interface KeyboardHandler {
  attach(element: HTMLElement): Disposable;
  onAction(listener: (action: KeyAction) => void): Disposable;
}

export function createKeyboardHandler(isVisible: () => boolean): KeyboardHandler {
  const listeners = new Set<(a: KeyAction) => void>();

  const emit = (a: KeyAction): void => {
    for (const l of listeners) l(a);
  };

  const mapKey = (ev: KeyboardEvent): KeyAction | null => {
    switch (ev.key) {
      case "Tab":
        return { type: "commit" };
      case "ArrowDown":
        return { type: "cycle", direction: 1 };
      case "ArrowUp":
        return { type: "cycle", direction: -1 };
      case "Escape":
        return { type: "dismiss" };
      default:
        return null;
    }
  };

  return {
    attach(element): Disposable {
      const handler = (ev: KeyboardEvent): void => {
        if (ev.isComposing) return;
        if (!isVisible()) return;
        const action = mapKey(ev);
        if (!action) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        emit(action);
      };
      element.addEventListener("keydown", handler, true);
      return { dispose: () => element.removeEventListener("keydown", handler, true) };
    },
    onAction(listener): Disposable {
      listeners.add(listener);
      return { dispose: () => listeners.delete(listener) };
    },
  };
}
