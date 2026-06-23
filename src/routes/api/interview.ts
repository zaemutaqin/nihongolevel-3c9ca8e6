import { createAPIFileRoute } from '@tanstack/start/api';
import { createClient } from '@supabase/supabase-js';

// WAJIB menggunakan 'APIRoute' agar kompilator TanStack Start tidak crash
export const APIRoute = createAPIFileRoute('/api/interview')({
  POST: async ({ request }) => {
    const responseHeaders = new Headers({ "Content-Type": "application/json" });
    try {
      const body = await request.json() as { message?: string; fingerprint?: string };
      
      // 1. Batasi input chat maksimal 500 karakter
      if (!body || !body.message || typeof body.message !== 'string') {
        return new Response(JSON.stringify({ error: "Pesan tidak boleh kosong" }), { status: 400, headers: responseHeaders });
      }
      const cleanMessage = body.message.trim().substring(0, 500);

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
            .eq('action_type', 'interview')
            .gte('created_at', today.toISOString());
          
          if (count !== null && count >= 5) {
            return new Response(JSON.stringify({ error: "Kuota interview harian habis." }), { status: 429, headers: responseHeaders });
          }
          await supabase.from('guest_rate_limits').insert({ guest_fingerprint: fingerprint, action_type: 'interview' });
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
            contents: [
              { role: "user", parts: [{ text: "Kamu adalah pewawancara kerja simulasi bahasa Jepang di Nihongolevel. Jawab sopan dengan arti Indonesia." }] },
              { role: "user", parts: [{ text: cleanMessage }] }
            ]
          })
        }
      );

      const data = await response.json() as any;
      const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return new Response(JSON.stringify({ reply: aiReply, response: aiReply }), { headers: responseHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal Error" }), { status: 500, headers: responseHeaders });
    }
  }
});
