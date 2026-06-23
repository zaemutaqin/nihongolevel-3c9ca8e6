// Tiny client-side fingerprint used as part of the guest rate-limit key.
// Combined with the request IP on the server. Persists in localStorage so
// repeat visits from the same browser increment the same counter.

const KEY = "nihongo_guest_fp_v1";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getGuestFingerprint(): string {
  if (typeof window === "undefined") return "";
  try {
    let v = window.localStorage.getItem(KEY);
    if (!v) {
      v = randomId();
      window.localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return "";
  }
}
