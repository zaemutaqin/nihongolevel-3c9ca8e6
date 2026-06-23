// Rate-limit helpers for guest (unauthenticated) endpoints.
// Reuses the existing public.guest_rate_limits table (ip TEXT, day DATE,
// count INT, updated_at TIMESTAMPTZ, PK(ip, day)).
//
// We namespace the key per feature so translate and interview don't share
// the same counter: e.g. "tr:1.2.3.4", "iv:1.2.3.4".

const GUEST_CAP_DEFAULT = 5;

export interface GuestLimitResult {
  ok: boolean;
  used: number;
  cap: number;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function checkGuestLimit(
  feature: "tr" | "iv",
  ipOrFingerprint: string,
  cap: number = GUEST_CAP_DEFAULT,
): Promise<GuestLimitResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const key = `${feature}:${ipOrFingerprint}`;
  const day = todayUtc();
  const { data } = await supabaseAdmin
    .from("guest_rate_limits")
    .select("count")
    .eq("ip", key)
    .eq("day", day)
    .maybeSingle();
  const used = data?.count ?? 0;
  return { ok: used < cap, used, cap };
}

export async function incrementGuestLimit(
  feature: "tr" | "iv",
  ipOrFingerprint: string,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const key = `${feature}:${ipOrFingerprint}`;
  const day = todayUtc();
  const { data } = await supabaseAdmin
    .from("guest_rate_limits")
    .select("count")
    .eq("ip", key)
    .eq("day", day)
    .maybeSingle();
  const nextCount = (data?.count ?? 0) + 1;
  await supabaseAdmin
    .from("guest_rate_limits")
    .upsert(
      { ip: key, day, count: nextCount, updated_at: new Date().toISOString() },
      { onConflict: "ip,day" },
    );
}

// Derive a stable guest key from IP + optional client-supplied fingerprint.
// Fingerprint is sent by the client (localStorage UUID); combining both makes
// it harder to bypass by either rotating IP or clearing localStorage alone.
export function deriveGuestKey(ip: string, fingerprint: string | null): string {
  const fp = (fingerprint || "").slice(0, 64).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!fp) return ip;
  return `${ip}|${fp}`;
}
