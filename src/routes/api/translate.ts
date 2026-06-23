import { createAPIFileRoute } from '@tanstack/start/api';
import { checkGuestRateLimit, logGuestUsage } from '../../lib/guest-rate-limit.server';

export const Route = createAPIFileRoute('/api/translate')({
  POST: async ({ request }) => {
    const responseHeaders = new Headers({ "Content-Type": "application/json" });
    try {
      const body = await request.json() as { text?: string; targetLanguage?: string; fingerprint?: string };
      
      // Mengatasi Celah 1: Batasi input maksimal 500 karakter saja
      if (!body || !body.text || typeof body.text !== 'string') {
        return new Response(JSON.stringify({ error: "Input tidak boleh kosong" }), { status: 400, headers: responseHeaders });
      }
      const cleanText = body.text.trim().substring(0, 500);
      const cleanLang = (body.targetLanguage || 'Jepang').trim().substring(0, 50);

      // Mengatasi Celah 2: Validasi kuota 5x harian via Supabase
      const fingerprint = body.fingerprint || null;
      const rateLimit = await checkGuestRateLimit(request, 'translate', fingerprint);
      if (!rateLimit.allowed) {
        return new Response(JSON.stringify({ error: "Kuota harian habis. Silakan login." }), { status: 429, headers: responseHeaders });
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
            contents: [{ parts: [{ text: `Terjemahkan teks berikut ke bahasa ${cleanLang}: "${cleanText}"` }] }]
          })
        }
      );

      const data = await response.json() as any;
      const translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Catat penggunaan ke database jika sukses
      await logGuestUsage(request, 'translate', fingerprint);

      return new Response(JSON.stringify({ translation: translatedText, text: translatedText }), { headers: responseHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal Error" }), { status: 500, headers: responseHeaders });
    }
  }
});
