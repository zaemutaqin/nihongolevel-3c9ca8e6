export async function action({ request, context }: { request: Request; context: any }) {
  try {
    const { text, targetLanguage } = await request.json();
    
    // Trik mutakhir membaca secret di berbagai runtime server Lovable
    const apiKey = 
      context?.env?.GEMINI_API_KEY || 
      (globalThis as any).process?.env?.GEMINI_API_KEY ||
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : null);

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Sistem gagal memuat kredensial AI. Periksa pengaturan Secret Lovable." }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Kamu adalah fitur translator profesional di aplikasi Nihongolevel. Terjemahkan teks berikut ke ${targetLanguage || 'Bahasa Jepang/Indonesia'}. Berikan juga cara baca Romaji, huruf Kana/Kanji yang tepat, beserta penjelasan tata bahasa singkat jika diperlukan. Teks: "${text}"`
          }]
        }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const translatedText = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ text: translatedText }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
