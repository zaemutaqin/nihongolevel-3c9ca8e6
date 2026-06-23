// File: src/lib/guest-rate-limit.server.ts
export async function checkGuestRateLimit(...args: any[]): Promise<any> {
  return { allowed: true, remaining: 5, resetTime: new Date().toISOString() };
}

export async function logGuestUsage(...args: any[]): Promise<any> {
  return true;
}
