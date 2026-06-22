// Jalur integrasi langsung ke Google Gemini API secara gratis
export async function action({ request }: { request: Request }) {
  try {
    const { text, targetLanguage } = await request.json();
    const apiKey = process.env.VITE_GEMINI_API_KEY;

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
