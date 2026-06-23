// File: src/routes/api/translate.ts
import { createAPIFileRoute } from '@tanstack/start/api';

export const Route = createAPIFileRoute('/api/translate')({
  POST: async ({ request }) => {
    const responseHeaders = new Headers({
      "Content-Type": "application/json"
    });

    try {
      const body = await request.json();
      
      if (!body || typeof body.text !== "string" || body.text.trim() === "") {
        return new Response(JSON.stringify({ error: "Input tidak valid." }), { status: 400, headers: responseHeaders });
      }

      const sanitizedText = body.text.replace(/[<>:"']/g, "").substring(0, 500);
      const targetLang = typeof body.targetLanguage === "string" ? body.targetLanguage.replace(/[<>:"']/g, "") : "Bahasa Jepang";

      // Membaca kunci Gemini dari environment platform Lovable
      const apiKey = (globalThis as any).process?.env?.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Kredensial AI tidak ditemukan." }), { status: 500, headers: responseHeaders });
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const geminiResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Kamu adalah fitur translator profesional di aplikasi Nihongolevel. Terjemahkan teks berikut ke ${targetLang}. Berikan juga cara baca Romaji, huruf Kana/Kanji yang tepat, beserta penjelasan tata bahasa singkat jika diperlukan. Teks: "${sanitizedText}"`
            }]
          }]
        })
      });

      const data = await geminiResponse.json();
      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: responseHeaders });
      }

      const translatedText = data.candidates[0].content.parts[0].text;

      return new Response(JSON.stringify({ 
        text: translatedText,
        translation: translatedText,
        result: translatedText,
        response: translatedText,
        message: translatedText
      }), { headers: responseHeaders });

    } catch (error: any) {
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: responseHeaders });
    }
  }
});
