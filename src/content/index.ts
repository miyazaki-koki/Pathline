import { createController } from "../controller/controller";

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
  const controller = createController();
  controller.bootstrap();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
