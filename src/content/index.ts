import { createController } from "../controller/controller";
import { FlexibleCandidateProvider } from "../core/flexibleProvider";
import { createChromeLLMStack } from "../core/llm/factory";
import { createTwoLayerProvider } from "../core/twoLayer/twoLayerProvider";
import { createSettingsStore, type LLMSetting } from "../settings/settingsStore";

declare global {
  interface Window {
    __pathline__?: { active: true };
  }
}

function boot(): void {
  const root = document.documentElement;
  if (root.getAttribute("data-pathline") === "active") return;
  root.setAttribute("data-pathline", "active");
  if (window.__pathline__?.active) return;
  window.__pathline__ = { active: true };

  const settings = createSettingsStore();
  let currentLLM: LLMSetting = "auto";
  void settings.load().then((s) => {
    currentLLM = s.llm;
  });
  settings.onChange((s) => {
    currentLLM = s.llm;
  });

  const rule = new FlexibleCandidateProvider();
  const llm = createChromeLLMStack();
  const twoLayer = createTwoLayerProvider({
    rule,
    llm: llm.provider,
    capability: llm.capability,
    getLLMSetting: () => currentLLM,
  });

  const hasLM = typeof (globalThis as unknown as { LanguageModel?: unknown }).LanguageModel !== "undefined";
  console.debug("[pathline] LanguageModel global:", hasLM ? "present" : "absent");
  void llm.capability.detect().then((status) => {
    console.debug("[pathline] llm capability:", status);
  });

  const controller = createController({ settings, provider: rule, twoLayer });
  controller.bootstrap();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
