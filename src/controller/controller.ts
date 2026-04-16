import { RuleBasedCandidateProvider, type CandidateProvider } from "../core/candidate";
import { FlexibleCandidateProvider } from "../core/flexibleProvider";
import { createSettingsStore, type SettingsStore, type Mode } from "../settings/settingsStore";
import { score } from "../core/scoring";
import { createStateMachine, type CategoryStateMachine } from "../core/stateMachine";
import { createDomWatcher, type DomWatcher } from "../dom/domWatcher";
import type { Disposable, InputTarget } from "../dom/types";
import { createGhostRenderer, type GhostRenderer } from "../view/ghostRenderer";
import { createKeyboardHandler, type KeyboardHandler } from "../input/keyboardHandler";

const MIN_LENGTH = 4;
const DEBOUNCE_MS = 150;
const DEBOUNCE_FAST_MS = 50;

function hashText(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

interface Session {
  readonly target: InputTarget;
  readonly state: CategoryStateMachine;
  readonly handler: KeyboardHandler;
  readonly disposables: Disposable[];
  timer: ReturnType<typeof setTimeout> | null;
  lastEvaluatedText: string;
  dismissedHash: string | null;
  visible: boolean;
  committed: boolean;
}

export interface PathlineController {
  bootstrap(): void;
  teardown(): void;
}

export interface ControllerDeps {
  readonly watcher?: DomWatcher;
  readonly renderer?: GhostRenderer;
  readonly provider?: CandidateProvider;
  readonly settings?: SettingsStore;
}

function providerFor(mode: Mode): CandidateProvider {
  return mode === "classic" ? new RuleBasedCandidateProvider() : new FlexibleCandidateProvider();
}

function shouldReevaluate(prev: string, next: string): boolean {
  if (next.length === 0) return true;
  if (Math.abs(next.length - prev.length) > 1) return true;
  if (next.includes("\n") !== prev.includes("\n")) return true;
  const structural = /[{}();=?？]/;
  if (structural.test(prev) !== structural.test(next)) return true;
  return prev !== next;
}

export function createController(deps: ControllerDeps = {}): PathlineController {
  const watcher = deps.watcher ?? createDomWatcher();
  const renderer = deps.renderer ?? createGhostRenderer();
  const settings = deps.settings ?? createSettingsStore();
  let provider: CandidateProvider = deps.provider ?? new FlexibleCandidateProvider();
  const providerExplicit = deps.provider !== undefined;
  const sessions = new WeakMap<HTMLElement, Session>();

  const evaluate = (session: Session): void => {
    const text = session.target.getText();
    if (session.committed) {
      renderer.hide(session.target);
      session.visible = false;
      return;
    }
    if (text.length < MIN_LENGTH) {
      renderer.hide(session.target);
      session.visible = false;
      return;
    }
    const h = hashText(text);
    if (session.dismissedHash === h) {
      renderer.hide(session.target);
      session.visible = false;
      return;
    }
    session.lastEvaluatedText = text;
    const vec = score(text);
    const top = session.state.reduce(vec);
    const candidate = provider.provide({ category: top, text });
    const resolved = candidate instanceof Promise ? null : candidate;
    if (resolved) {
      renderer.render(session.target, resolved);
      session.visible = true;
    }
  };

  const scheduleEvaluate = (session: Session, text: string): void => {
    if (session.committed) return;
    if (!shouldReevaluate(session.lastEvaluatedText, text)) return;
    if (session.timer) clearTimeout(session.timer);
    const vec = score(text);
    const delay = vec.explicit ? DEBOUNCE_FAST_MS : DEBOUNCE_MS;
    session.timer = setTimeout(() => evaluate(session), delay);
  };

  const createSession = (target: InputTarget): Session => {
    const handler = createKeyboardHandler(() => session.visible);
    const disposables: Disposable[] = [];
    const session: Session = {
      target,
      state: createStateMachine(),
      handler,
      disposables,
      timer: null,
      lastEvaluatedText: "",
      dismissedHash: null,
      visible: false,
      committed: false,
    };

    disposables.push(
      target.onInput((text) => {
        if (session.committed && text.trim().length === 0) {
          session.committed = false;
        }
        if (session.dismissedHash && hashText(text) !== session.dismissedHash) {
          session.dismissedHash = null;
        }
        scheduleEvaluate(session, text);
      }),
    );
    disposables.push(
      target.onBlur(() => {
        renderer.hide(target);
        session.visible = false;
      }),
    );
    disposables.push(handler.attach(target.element));
    disposables.push(
      handler.onAction((action) => {
        if (action.type === "commit") {
          const text = target.getText();
          const top = session.state.reduce(score(text));
          const c = provider.provide({ category: top, text });
          if (!(c instanceof Promise)) {
            target.setText(c.body);
            session.dismissedHash = hashText(c.body);
            session.lastEvaluatedText = c.body;
            session.committed = true;
          }
          renderer.hide(target);
          session.visible = false;
          if (session.timer) {
            clearTimeout(session.timer);
            session.timer = null;
          }
        } else if (action.type === "cycle") {
          session.state.cycle(action.direction);
          const c = provider.provide({ category: session.state.current, text: target.getText() });
          if (!(c instanceof Promise)) {
            renderer.render(target, c);
            session.visible = true;
          }
        } else {
          session.dismissedHash = hashText(target.getText());
          renderer.hide(target);
          session.visible = false;
        }
      }),
    );

    return session;
  };

  return {
    bootstrap(): void {
      if (!providerExplicit) {
        void settings.load().then(({ mode }) => {
          provider = providerFor(mode);
        });
        settings.onChange((mode) => {
          provider = providerFor(mode);
        });
      }
      watcher.onAttach((target) => {
        if (sessions.has(target.element)) return;
        sessions.set(target.element, createSession(target));
      });
      watcher.onDetach((target) => {
        const s = sessions.get(target.element);
        if (!s) return;
        if (s.timer) clearTimeout(s.timer);
        s.disposables.forEach((d) => d.dispose());
        renderer.hide(target);
        sessions.delete(target.element);
      });
      watcher.start();
    },
    teardown(): void {
      watcher.stop();
    },
  };
}
