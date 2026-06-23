// File: src/routes/api/interview.ts
// Menggunakan standar Web API murni agar lolos build TanStack/Vite

export async function action({ request, context }: { request: Request; context: any }) {
  const responseHeaders = new Headers({
    "Content-Type": "application/json"
  });

  try {
    const body = await request.json();
    
    if (!body || typeof body.message !== "string" || body.message.trim() === "") {
      return new Response(JSON.stringify({ error: "Pesan tidak valid." }), { status: 400, headers: responseHeaders });
    }

    const sanitizedMessage = body.message.replace(/[<>:"']/g, "").substring(0, 500);

    const apiKey = context?.env?.GEMINI_API_KEY || (globalThis as any).process?.env?.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Kredensial AI tidak terkonfigurasi di Secrets." }), { status: 500, headers: responseHeaders });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const systemInstruction = "Kamu adalah Pewawancara kerja atau Guru Bahasa Jepang asli dalam sesi interview interaktif di aplikasi Nihongolevel. Jawab pengguna menggunakan bahasa Jepang yang natural (sopan/bisnis), sertakan Romaji dan arti bahasa Indonesia di bawahnya dengan rapi. Ajukan tepat 1 pertanyaan baru di akhir kalimat.";

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
          { role: "model", parts: [{ text: "Baik, saya siap menjadi pewawancara simulasi bahasa Jepang." }] },
          { role: "user", parts: [{ text: sanitizedMessage }] }
        ]
      })
    });

    const data = await geminiResponse.json();
    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers: responseHeaders });
    }

    const aiReply = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ 
      reply: aiReply,
      response: aiReply,
      message: aiReply,
      text: aiReply
    }), { headers: responseHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: responseHeaders });
  }
}
