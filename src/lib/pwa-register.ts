// Service worker registration with strict guards per Lovable PWA skill.
// - Never registers in dev / Lovable preview / iframe / ?sw=off
// - Unregisters any matching SW in those contexts

const SW_PATH = "/sw.js";

function isForbiddenContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true; // iframe
  } catch {
    return true;
  }
  const url = new URL(window.location.href);
  if (url.searchParams.get("sw") === "off") return true;
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  if (h === "lovableproject.com" || h.endsWith(".lovableproject.com")) return true;
  if (h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com")) return true;
  if (h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")) return true;
  return false;
}

async function unregisterMatchingSWs() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(SW_PATH);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    // ignore
  }
}

export function registerPwa() {
  if (typeof window === "undefined") return;
  if (isForbiddenContext()) {
    void unregisterMatchingSWs();
    return;
  }
  if (!("serviceWorker" in navigator)) return;
  // Defer to idle so it never competes with hydration
  const start = () => {
    navigator.serviceWorker.register(SW_PATH).catch((err) => {
      console.warn("[pwa] SW registration failed", err);
    });
  };
  const w = window as Window & { requestIdleCallback?: (cb: () => void) => void };
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(start);
  } else {
    w.setTimeout(start, 1500);
  }
}
