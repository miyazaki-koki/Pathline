import { RuleBasedCandidateProvider, type Candidate, type CandidateProvider } from "../core/candidate";
import { FlexibleCandidateProvider } from "../core/flexibleProvider";
import {
  createSettingsStore,
  type Mode,
  type Settings,
  type SettingsStore,
} from "../settings/settingsStore";
import { score } from "../core/scoring";
import { createStateMachine, type CategoryStateMachine } from "../core/stateMachine";
import { createDomWatcher, type DomWatcher } from "../dom/domWatcher";
import type { Disposable, InputTarget } from "../dom/types";
import { createGhostRenderer, type GhostRenderer } from "../view/ghostRenderer";
import { createKeyboardHandler, type KeyboardHandler } from "../input/keyboardHandler";
import {
  createTwoLayerProvider,
  type TwoLayerCandidateProvider,
} from "../core/twoLayer/twoLayerProvider";
import type { LanguageModelProvider } from "../core/llm/languageModelProvider";
import type { LanguageModelCapability } from "../core/llm/capability";

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
  pendingController: AbortController | null;
  visibleCandidate: Candidate | null;
  requestId: number;
}

export interface PathlineController {
  bootstrap(): void;
  teardown(): void;
}

export interface ControllerDeps {
  readonly watcher?: DomWatcher;
  readonly renderer?: GhostRenderer;
  readonly provider?: CandidateProvider;
  readonly twoLayer?: TwoLayerCandidateProvider;
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

const NOOP_LLM: LanguageModelProvider = { generate: async () => null };
const NOOP_CAPABILITY: LanguageModelCapability = {
  detect: async () => "unavailable",
  cachedStatus: "unavailable",
};

export function createController(deps: ControllerDeps = {}): PathlineController {
  const watcher = deps.watcher ?? createDomWatcher();
  const renderer = deps.renderer ?? createGhostRenderer();
  const settings = deps.settings ?? createSettingsStore();
  let currentSettings: Settings = { mode: "flexible", llm: "auto" };
  let ruleProvider: CandidateProvider = deps.provider ?? new FlexibleCandidateProvider();
  const providerExplicit = deps.provider !== undefined;

  const twoLayer: TwoLayerCandidateProvider =
    deps.twoLayer ??
    createTwoLayerProvider({
      rule: {
        provide: (req) => ruleProvider.provide(req),
      },
      llm: NOOP_LLM,
      capability: NOOP_CAPABILITY,
      getLLMSetting: () => currentSettings.llm,
    });

  const sessions = new WeakMap<HTMLElement, Session>();
  const activeSessions = new Set<Session>();

  const abortPending = (session: Session): void => {
    if (session.pendingController) {
      session.pendingController.abort();
      session.pendingController = null;
    }
  };

  const runTwoLayer = (
    session: Session,
    category: Session["state"]["current"],
    text: string,
  ): void => {
    abortPending(session);
    const reqId = ++session.requestId;
    const ac = new AbortController();
    session.pendingController = ac;
    const { immediate, pending } = twoLayer.provide({ category, text }, ac.signal);
    renderer.render(session.target, immediate);
    session.visibleCandidate = immediate;
    session.visible = true;
    pending
      .then((llmCandidate) => {
        if (ac.signal.aborted) return;
        if (session.requestId !== reqId) return;
        if (!llmCandidate) return;
        if (session.visibleCandidate && session.visibleCandidate.hash === llmCandidate.hash) return;
        renderer.render(session.target, llmCandidate);
        session.visibleCandidate = llmCandidate;
      })
      .catch(() => undefined);
  };

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
    runTwoLayer(session, top, text);
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
      pendingController: null,
      visibleCandidate: null,
      requestId: 0,
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
        abortPending(session);
        renderer.hide(target);
        session.visible = false;
        session.visibleCandidate = null;
      }),
    );
    disposables.push(handler.attach(target.element));
    disposables.push(
      handler.onAction((action) => {
        if (action.type === "commit") {
          abortPending(session);
          const chosen = session.visibleCandidate;
          if (chosen) {
            target.setText(chosen.body);
            session.dismissedHash = hashText(chosen.body);
            session.lastEvaluatedText = chosen.body;
            session.committed = true;
          }
          renderer.hide(target);
          session.visible = false;
          session.visibleCandidate = null;
          if (session.timer) {
            clearTimeout(session.timer);
            session.timer = null;
          }
        } else if (action.type === "cycle") {
          session.state.cycle(action.direction);
          runTwoLayer(session, session.state.current, target.getText());
        } else {
          abortPending(session);
          session.dismissedHash = hashText(target.getText());
          renderer.hide(target);
          session.visible = false;
          session.visibleCandidate = null;
        }
      }),
    );

    return session;
  };

  return {
    bootstrap(): void {
      if (!providerExplicit) {
        void settings.load().then((s) => {
          currentSettings = s;
          ruleProvider = providerFor(s.mode);
        });
        settings.onChange((s) => {
          const prevLLM = currentSettings.llm;
          currentSettings = s;
          ruleProvider = providerFor(s.mode);
          if (prevLLM !== "off" && s.llm === "off") {
            for (const sess of activeSessions) abortPending(sess);
          }
        });
      } else {
        void settings.load().then((s) => {
          currentSettings = s;
        });
        settings.onChange((s) => {
          const prevLLM = currentSettings.llm;
          currentSettings = s;
          if (prevLLM !== "off" && s.llm === "off") {
            for (const sess of activeSessions) abortPending(sess);
          }
        });
      }
      watcher.onAttach((target) => {
        if (sessions.has(target.element)) return;
        const session = createSession(target);
        sessions.set(target.element, session);
        activeSessions.add(session);
      });
      watcher.onDetach((target) => {
        const s = sessions.get(target.element);
        if (!s) return;
        abortPending(s);
        if (s.timer) clearTimeout(s.timer);
        s.disposables.forEach((d) => d.dispose());
        renderer.hide(target);
        sessions.delete(target.element);
        activeSessions.delete(s);
      });
      watcher.start();
    },
    teardown(): void {
      watcher.stop();
      for (const s of activeSessions) abortPending(s);
    },
  };
}
