// File: src/routes/api/translate.ts
import { createAPIFileRoute } from '@tanstack/start/api';

export const Route = createAPIFileRoute('/api/translate')({
  POST: async ({ request }) => {
    try {
      const body = await request.json() as { text?: string; targetLanguage?: string };
      
      if (!body || !body.text) {
        return new Response(JSON.stringify({ error: "Input kosong" }), { status: 400 });
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
          contents: [{ parts: [{ text: `Terjemahkan ke ${body.targetLanguage || 'Jepang'}: ${body.text}` }] }]
        })
      });

      const data = await response.json() as any;
      const translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal menerjemahkan";

      return new Response(JSON.stringify({ 
        text: translatedText,
        translation: translatedText,
        response: translatedText
      }), { headers: { "Content-Type": "application/json" } });

    } catch (e: any) {
      return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
    }
  }
});
