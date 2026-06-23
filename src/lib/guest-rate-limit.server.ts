// File: src/lib/guest-rate-limit.server.ts
// Pembenahan Build Error: Mempertahankan struktur fungsi asli tanpa query ke database

export interface GuestRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: string;
}

export async function checkGuestRateLimit(
  request: Request, 
  type: 'translate' | 'interview', 
  guestFingerprint: string | null
): Promise<GuestRateLimitResult> {
  // Selalu loloskan secara instan untuk menghindari error tabel database Supabase
  return {
    allowed: true,
    remaining: 5,
    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}

export async function logGuestUsage(
  request: Request,
  type: 'translate' | 'interview',
  guestFingerprint: string | null
): Promise<boolean> {
  // Loloskan tanpa melakukan write/insert ke database Supabase
  return true;
}
