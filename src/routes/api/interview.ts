export async function action({ request }: { request: Request }) {
  try {
    const { message, history } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key tidak ditemukan" }), { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Menata prompt agar Gemini bertindak sebagai pewawancara bahasa Jepang
    const systemInstruction = "Kamu adalah Pewawancara kerja (Kanshuu) atau Guru Bahasa Jepang asli dalam sesi interview interaktif di aplikasi Nihongolevel. Jawab pengguna menggunakan bahasa Jepang yang natural (sopan/bisnis), sertakan Romaji dan arti bahasa Indonesia di bawahnya dengan rapi. Ajukan tepat 1 pertanyaan baru di akhir kalimat untuk melanjutkan interview.";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
          { role: "model", parts: [{ text: "Baik, saya siap menjadi pewawancara simulasi bahasa Jepang." }] },
          // Anda bisa memetakan history chat lama di sini jika ada, atau langsung mengirim pesan user terbaru:
          { role: "user", parts: [{ text: message }] }
        ]
      })
    });

    const data = await response.json();
    const aiReply = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ reply: aiReply }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
