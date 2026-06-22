// Jalur integrasi langsung ke Google Gemini API secara gratis
export async function action({ request }: { request: Request }) {
  try {
    const { text, targetLanguage } = await request.json();
    // Mengambil API Key dari context environment server Lovable
const apiKey = (context as any)?.env?.GEMINI_API_KEY || (globalThis as any).process?.env?.GEMINI_API_KEY;
    if (!apiKey) {
  console.error("DEBUG: GEMINI_API_KEY kosong atau tidak terbaca oleh server.");
}



    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key Gemini belum terkonfigurasi di .env" }), { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Kamu adalah fitur translator profesional di aplikasi Nihongolevel. Terjemahkan teks berikut ke ${targetLanguage || 'Bahasa Jepang/Indonesia'}. Berikan juga cara baca Romaji, huruf Kana/Kanji yang tepat, beserta penjelasan tata bahasa singkat jika diperlukan. Teks: "${text}"`
          }]
        }]
      })
    });

    const data = await response.json();
    const translatedText = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ text: translatedText }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
