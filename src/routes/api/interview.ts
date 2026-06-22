import { json } from "@remix-run/node";
import { createServerClient } from "@supabase/auth-helpers-remix";

export async function action({ request, context }: { request: Request; context: any }) {
  const responseHeaders = new Headers();
  
  const supabaseUrl = context?.env?.SUPABASE_URL || (globalThis as any).process?.env?.SUPABASE_URL;
  const supabaseAnonKey = context?.env?.SUPABASE_ANON_KEY || (globalThis as any).process?.env?.SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { request, response: responseHeaders });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return json({ error: "Unauthorized. Silakan login terlebih dahulu." }, { status: 401, headers: responseHeaders });
    }
  }

  try {
    const body = await request.json();
    
    // Validasi Skema Input Sintaksis (Mencegah Masalah 1)
    if (!body || typeof body.message !== "string" || body.message.trim() === "") {
      return json({ error: "Bad Request. Pesan tidak valid." }, { status: 400, headers: responseHeaders });
    }

    // Pembersihan input pesan dari prompt injection
    const sanitizedMessage = body.message.replace(/[<>:"']/g, "").substring(0, 500);

    const apiKey = context?.env?.GEMINI_API_KEY || (globalThis as any).process?.env?.GEMINI_API_KEY;
    if (!apiKey) {
      return json({ error: "Kredensial AI tidak terkonfigurasi." }, { status: 500, headers: responseHeaders });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const systemInstruction = "Kamu adalah Pewawancara kerja (Kanshuu) atau Guru Bahasa Jepang asli dalam sesi interview interaktif di aplikasi Nihongolevel. Jawab pengguna menggunakan bahasa Jepang yang natural (sopan/bisnis), sertakan Romaji dan arti bahasa Indonesia di bawahnya dengan rapi. Ajukan tepat 1 pertanyaan baru di akhir kalimat untuk melanjutkan interview.";

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
      return json({ error: data.error.message }, { status: 400, headers: responseHeaders });
    }

    const aiReply = data.candidates[0].content.parts[0].text;

    return json({ 
      reply: aiReply,
      response: aiReply,
      message: aiReply,
      text: aiReply
    }, { headers: responseHeaders });

  } catch (error: any) {
    return json({ error: error.message }, { status: 500, headers: responseHeaders });
  }
}
