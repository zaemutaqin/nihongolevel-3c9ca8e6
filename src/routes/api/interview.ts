export async function action({ request, context }: { request: Request; context: any }) {
  try {
    const { message } = await request.json();
    
    // Trik mutakhir membaca secret di berbagai runtime server Lovable
    const apiKey = 
      context?.env?.GEMINI_API_KEY || 
      (globalThis as any).process?.env?.GEMINI_API_KEY ||
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : null);

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Sistem gagal memuat kredensial AI." }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const systemInstruction = "Kamu adalah Pewawancara kerja (Kanshuu) atau Guru Bahasa Jepang asli dalam sesi interview interaktif di aplikasi Nihongolevel. Jawab pengguna menggunakan bahasa Jepang yang natural (sopan/bisnis), sertakan Romaji dan arti bahasa Indonesia di bawahnya dengan rapi. Ajukan tepat 1 pertanyaan baru di akhir kalimat untuk melanjutkan interview.";

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
          { role: "model", parts: [{ text: "Baik, saya siap menjadi pewawancara simulasi bahasa Jepang." }] },
          { role: "user", parts: [{ text: message }] }
        ]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const aiReply = data.candidates[0].content.parts[0].text;

    // Menyesuaikan struktur return agar cocok dengan state frontend 'reply'
    return new Response(JSON.stringify({ reply: aiReply }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
