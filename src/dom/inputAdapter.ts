import type { Disposable, InputTarget, InputTargetKind } from "./types";

function kindOf(el: HTMLElement): InputTargetKind {
  if (el instanceof HTMLTextAreaElement) return "textarea";
  return "contenteditable";
}

function setTextareaValue(el: HTMLTextAreaElement, value: string): void {
  const proto = Object.getPrototypeOf(el) as object;
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  const setter = desc?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
}

export function createInputTarget(el: HTMLElement): InputTarget {
  const kind = kindOf(el);
  let composing = false;

  el.addEventListener("compositionstart", () => {
    composing = true;
  });
  el.addEventListener("compositionend", () => {
    composing = false;
  });

  const getText = (): string => {
    if (kind === "textarea") return (el as HTMLTextAreaElement).value;
    return el.textContent ?? "";
  };

  const setText = (value: string): void => {
    if (kind === "textarea") {
      setTextareaValue(el as HTMLTextAreaElement, value);
    } else {
      el.textContent = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const subscribe = <T extends Event>(
    type: string,
    cb: (ev: T) => void,
  ): Disposable => {
    const handler = (ev: Event): void => cb(ev as T);
    el.addEventListener(type, handler);
    return {
      dispose: () => el.removeEventListener(type, handler),
    };
  };

  return {
    kind,
    element: el,
    getText,
    setText,
    focus: () => el.focus(),
    onInput(listener) {
      const inputDisp = subscribe<Event>("input", () => {
        listener(getText());
      });
      const endDisp = subscribe<CompositionEvent>("compositionend", () => {
        listener(getText());
      });
      return {
        dispose: () => {
          inputDisp.dispose();
          endDisp.dispose();
        },
      };
    },
    onBlur(listener) {
      return subscribe<FocusEvent>("blur", () => listener());
    },
    onFocus(listener) {
      return subscribe<FocusEvent>("focus", () => listener());
    },
  };
}
