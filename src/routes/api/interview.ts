import { createAPIFileRoute } from '@tanstack/start/api';
import { checkGuestRateLimit, logGuestUsage } from '../../lib/guest-rate-limit.server';

export const Route = createAPIFileRoute('/api/interview')({
  POST: async ({ request }) => {
    const responseHeaders = new Headers({ "Content-Type": "application/json" });
    try {
      const body = await request.json() as { message?: string; fingerprint?: string };
      
      // Mengatasi Celah 1: Batasi input chat interview
      if (!body || !body.message || typeof body.message !== 'string') {
        return new Response(JSON.stringify({ error: "Pesan tidak boleh kosong" }), { status: 400, headers: responseHeaders });
      }
      const cleanMessage = body.message.trim().substring(0, 500);

      // Mengatasi Celah 2: Validasi kuota harian interview
      const fingerprint = body.fingerprint || null;
      const rateLimit = await checkGuestRateLimit(request, 'interview', fingerprint);
      if (!rateLimit.allowed) {
        return new Response(JSON.stringify({ error: "Kuota interview gratis hari ini habis." }), { status: 429, headers: responseHeaders });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "API Key missing" }), { status: 500, headers: responseHeaders });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: "Kamu adalah pewawancara kerja simulasi bahasa Jepang di Nihongolevel. Jawab sopan dengan arti Indonesia." }] },
              { role: "user", parts: [{ text: cleanMessage }] }
            ]
          }
        }
      );

      const data = await response.json() as any;
      const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      await logGuestUsage(request, 'interview', fingerprint);

      return new Response(JSON.stringify({ reply: aiReply, response: aiReply }), { headers: responseHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal Error" }), { status: 500, headers: responseHeaders });
    }
  }
});
