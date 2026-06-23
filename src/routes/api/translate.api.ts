import { createAPIFileRoute } from '@tanstack/start/api';

export const APIRoute = createAPIFileRoute('/api/translate')({
  OPTIONS: () => new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  }),
  POST: async ({ request }) => {
    const responseHeaders = new Headers({ 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    
    try {
      const body = await request.json() as { text?: string };
      
      const apiKey = process.env.GEMINI_API_KEY || (globalThis as any).process?.env?.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ translation: "⚠️ API Key belum terpasang.", text: "⚠️ API Key belum terpasang." }), { status: 200, headers: responseHeaders });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Terjemahkan ke bahasa Jepang beserta Romaji: "${body.text || ""}"` }] }]
          })
        }
      );

      const data = await response.json() as any;
      const translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal menerjemahkan.";
      return new Response(JSON.stringify({ translation: translatedText, text: translatedText }), { status: 200, headers: responseHeaders });

    } catch (error: any) {
      return new Response(JSON.stringify({ translation: `⚠️ SERVER ERROR: ${error.message}`, text: `⚠️ SERVER ERROR: ${error.message}` }), { status: 200, headers: responseHeaders });
    }
  }
});
