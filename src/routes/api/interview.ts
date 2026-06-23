// File: src/routes/api/interview.ts
import { createAPIFileRoute } from '@tanstack/start/api';

export const Route = createAPIFileRoute('/api/interview')({
  POST: async ({ request }) => {
    try {
      const body = await request.json() as { message?: string };
      
      if (!body || !body.message) {
        return new Response(JSON.stringify({ error: "Pesan kosong" }), { status: 400 });
      }

      const apiKey = (globalThis as any).process?.env?.GEMINI_API_KEY || (process?.env?.GEMINI_API_KEY);
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "API Key belum terkonfigurasi" }), { status: 500 });
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: "Jawab dengan bahasa Jepang sopan, beri romaji dan arti Indonesia harian. Beri 1 pertanyaan baru di akhir." }] },
            { role: "model", parts: [{ text: "Hai, wakarimashita." }] },
            { role: "user", parts: [{ text: body.message }] }
          ]
        })
      });

      const data = await response.json() as any;
      const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, coba lagi.";

      return new Response(JSON.stringify({ 
        reply: aiReply,
        response: aiReply,
        message: aiReply
      }), { headers: { "Content-Type": "application/json" } });

    } catch (e: any) {
      return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
    }
  }
});
