// File: src/lib/guest-rate-limit.server.ts
// Bypass manual untuk meloloskan rate limit guest tanpa database Supabase

export async function checkGuestRateLimit(
  request: Request, 
  type: 'translate' | 'interview', 
  guestFingerprint: string | null
) {
  // Kita buat sistem selalu mengizinkan (allowed: true) agar tidak memicu error database internal
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
) {
  // Kosongkan fungsinya agar tidak melakukan write/insert ke tabel database yang error atau belum ada
  return true;
}
