import { createAPIFileRoute } from '@tanstack/start/api';
import { createClient } from '@supabase/supabase-js';

// WAJIB menggunakan 'APIRoute' agar kompilator TanStack Start tidak crash
export const APIRoute = createAPIFileRoute('/api/translate')({
  POST: async ({ request }) => {
    const responseHeaders = new Headers({ "Content-Type": "application/json" });
    try {
      const body = await request.json() as { text?: string; targetLanguage?: string; fingerprint?: string };
      
      // 1. Batasi input maksimal 500 karakter
      if (!body || !body.text || typeof body.text !== 'string') {
        return new Response(JSON.stringify({ error: "Input tidak boleh kosong" }), { status: 400, headers: responseHeaders });
      }
      const cleanText = body.text.trim().substring(0, 500);
      const cleanLang = (body.targetLanguage || 'Jepang').trim().substring(0, 50);

      // 2. Cek Kuota Supabase secara Inline (Langsung)
      const fingerprint = body.fingerprint || null;
      if (fingerprint) {
        const supabaseUrl = process.env.SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const { count } = await supabase.from('guest_rate_limits')
            .select('*', { count: 'exact', head: true })
            .eq('guest_fingerprint', fingerprint)
            .eq('action_type', 'translate')
            .gte('created_at', today.toISOString());
          
          if (count !== null && count >= 5) {
            return new Response(JSON.stringify({ error: "Kuota harian habis. Silakan login." }), { status: 429, headers: responseHeaders });
          }
          await supabase.from('guest_rate_limits').insert({ guest_fingerprint: fingerprint, action_type: 'translate' });
        }
      }

      // 3. Panggil Gemini API
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

      return new Response(JSON.stringify({ translation: translatedText, text: translatedText }), { headers: responseHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal Error" }), { status: 500, headers: responseHeaders });
    }
  }
});
