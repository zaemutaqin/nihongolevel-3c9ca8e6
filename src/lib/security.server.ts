// Server-only security helpers: CORS, sanitization, redaction, audit logging,
// rate-limit lookups. Never import from client code (file is *.server.ts).
import { timingSafeEqual } from "crypto";

const ALLOWED_ORIGIN_SUFFIX = ".lovable.app";
const ALLOWED_EXACT = new Set<string>([
  "https://nihongolevel.lovable.app",
]);

export function pickAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Same-origin form/SSR requests have no Origin header; fall back to
    // host/referer match.
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");
    if (referer && host) {
      try {
        const r = new URL(referer);
        if (r.host === host) return `${r.protocol}//${r.host}`;
      } catch { /* ignore */ }
    }
    return null;
  }
  if (ALLOWED_EXACT.has(origin)) return origin;
  try {
    const u = new URL(origin);
    if (u.protocol === "https:" && u.hostname.endsWith(ALLOWED_ORIGIN_SUFFIX)) {
      return origin;
    }
  } catch { /* ignore */ }
  return null;
}

export function securityHeaders(allowedOrigin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    Vary: "Origin",
  };
  if (allowedOrigin) {
    h["Access-Control-Allow-Origin"] = allowedOrigin;
    h["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
    h["Access-Control-Max-Age"] = "86400";
  }
  return h;
}

export function jsonResponse(
  body: unknown,
  status: number,
  allowedOrigin: string | null,
  extra?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...securityHeaders(allowedOrigin),
      ...(extra ?? {}),
    },
  });
}

export function preflightResponse(allowedOrigin: string | null): Response {
  return new Response(null, {
    status: allowedOrigin ? 204 : 403,
    headers: securityHeaders(allowedOrigin),
  });
}

export function clientIp(request: Request): string {
  const fwd =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return fwd || "unknown";
}

// ---------------- Input sanitization ----------------

/**
 * Strip HTML tags and obvious script payloads. Does NOT filter SQL/JS
 * keywords — those false-positive on normal sentences and SQLi is already
 * prevented by parameterized Supabase queries.
 */
export function sanitizeInput(raw: unknown): { ok: true; value: string } | { ok: false } {
  if (typeof raw !== "string") return { ok: false };
  let s = raw;
  // Strip HTML/XML tags
  s = s.replace(/<[^>]*>/g, " ");
  // Strip javascript: / data: protocol handlers
  s = s.replace(/\b(?:javascript|data|vbscript)\s*:/gi, " ");
  // Strip event handler attributes that survive tag stripping
  s = s.replace(/\son\w+\s*=\s*"[^"]*"/gi, " ");
  s = s.replace(/\son\w+\s*=\s*'[^']*'/gi, " ");
  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  if (s.length === 0) return { ok: false };
  if (s.length > 500) return { ok: false };
  return { ok: true, value: s };
}

// ---------------- Personal data redaction ----------------

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// Indonesian phones: 08xx (8-14 digits total) and +62 variants
const PHONE_RE = /(?:\+62|62|0)8\d{1,3}[-\s]?\d{3,4}[-\s]?\d{3,5}/g;
// 16-digit ID-card-ish runs (Indonesian KTP / generic card numbers)
const ID16_RE = /\b\d{16}\b/g;

export function redactPersonalData(input: string): { value: string; redacted: boolean } {
  let redacted = false;
  const replaced = input
    .replace(EMAIL_RE, () => { redacted = true; return "[REDACTED_EMAIL]"; })
    .replace(PHONE_RE, () => { redacted = true; return "[REDACTED_PHONE]"; })
    .replace(ID16_RE, () => { redacted = true; return "[REDACTED_ID]"; });
  return { value: replaced, redacted };
}

// Minimal inappropriate-content gate. The AI provider has its own safety
// filters; we just block a small set of obvious slurs/sexual-minor terms.
const BLOCKED_PATTERNS: RegExp[] = [
  /\bchild\s*porn/i,
  /\bcp(?:\s+download)?\b/i,
];
export function isInappropriate(input: string): boolean {
  return BLOCKED_PATTERNS.some((re) => re.test(input));
}

// ---------------- Constant-time string compare ----------------

export function safeStringEqual(a: string, b: string): boolean {
  // Pad to equal length to avoid length-leak via early-return
  const max = Math.max(a.length, b.length);
  const ab = Buffer.from(a.padEnd(max, "\0"));
  const bb = Buffer.from(b.padEnd(max, "\0"));
  return ab.length === bb.length && timingSafeEqual(ab, bb) && a.length === b.length;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------- Audit log ----------------

export type AuditEvent =
  | "translate_success"
  | "translate_fail"
  | "translate_rate_limited"
  | "translate_anomaly"
  | "translate_personal_data_redacted"
  | "translate_inappropriate"
  | "translate_invalid_input"
  | "activate_pro_success"
  | "activate_pro_invalid"
  | "activate_pro_rate_limited"
  | "auth_failure";

export interface AuditEntry {
  event_type: AuditEvent;
  user_id?: string | null;
  ip_address?: string | null;
  input_length?: number | null;
  success: boolean;
  error_code?: string | null;
  metadata?: Record<string, unknown>;
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("audit_logs").insert({
      event_type: entry.event_type,
      user_id: entry.user_id ?? null,
      ip_address: entry.ip_address ?? null,
      input_length: entry.input_length ?? null,
      success: entry.success,
      error_code: entry.error_code ?? null,
      metadata: (entry.metadata ?? {}) as never,
    });
  } catch (e) {
    // Never let audit failure break the request path.
    console.error("audit insert failed", e);
  }
}

// ---------------- Rate-limit counts ----------------

export async function countEventsForUser(
  userId: string,
  eventTypes: AuditEvent[],
  sinceIso: string,
): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("event_type", eventTypes)
    .gte("ts", sinceIso);
  return count ?? 0;
}

export async function countEventsForIp(
  ip: string,
  eventTypes: AuditEvent[],
  sinceIso: string,
): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .in("event_type", eventTypes)
    .gte("ts", sinceIso);
  return count ?? 0;
}

export function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}
