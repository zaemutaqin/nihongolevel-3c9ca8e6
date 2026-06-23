import { createAPIFileRoute } from '@tanstack/start/api';

export const APIRoute = createAPIFileRoute('/api/interview')({
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
      const body = await request.json() as { message?: string };
      
      const apiKey = process.env.GEMINI_API_KEY || (globalThis as any).process?.env?.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ reply: "⚠️ LAPORAN: API Key Gemini belum terpasang di Lovable.", response: "⚠️ LAPORAN: API Key Gemini belum terpasang di Lovable." }), { status: 200, headers: responseHeaders });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Jawab sebagai Pewawancara Jepang dengan bahasa Indonesia: " + (body.message || "") }] }]
          })
        }
      );

      const data = await response.json() as any;
      if (data.error) {
        return new Response(JSON.stringify({ reply: `⚠️ ERROR GEMINI: ${data.error.message}`, response: `⚠️ ERROR GEMINI: ${data.error.message}` }), { status: 200, headers: responseHeaders });
      }

      const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sukses, tapi kosong.";
      return new Response(JSON.stringify({ reply: aiReply, response: aiReply }), { status: 200, headers: responseHeaders });

    } catch (error: any) {
      return new Response(JSON.stringify({ reply: `⚠️ SERVER ERROR: ${error.message}`, response: `⚠️ SERVER ERROR: ${error.message}` }), { status: 200, headers: responseHeaders });
    }
  }
});
