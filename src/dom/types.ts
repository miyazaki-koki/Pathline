export type InputTargetKind = "textarea" | "contenteditable";

export interface Disposable {
  dispose(): void;
}

export interface InputTarget {
  readonly kind: InputTargetKind;
  readonly element: HTMLElement;
  getText(): string;
  setText(value: string): void;
  focus(): void;
  onInput(listener: (text: string) => void): Disposable;
  onBlur(listener: () => void): Disposable;
  onFocus(listener: () => void): Disposable;
}
