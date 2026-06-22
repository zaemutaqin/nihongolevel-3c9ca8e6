import { json } from "@remix-run/node";
import { createServerClient } from "@supabase/auth-helpers-remix";

export async function action({ request, context }: { request: Request; context: any }) {
  // Ambil data response & session untuk validasi autentikasi pengguna (Mencegah Masalah 2)
  const responseHeaders = new Headers();
  
  // Asumsi variabel standar Supabase URL & Anon Key di env global
  const supabaseUrl = context?.env?.SUPABASE_URL || (globalThis as any).process?.env?.SUPABASE_URL;
  const supabaseAnonKey = context?.env?.SUPABASE_ANON_KEY || (globalThis as any).process?.env?.SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { request, response: responseHeaders });
    const { data: { session } } = await supabase.auth.getSession();
    
    // Blokir jika pengguna belum login/tidak sah
    if (!session) {
      return json({ error: "Unauthorized. Silakan login terlebih dahulu." }, { status: 401, headers: responseHeaders });
    }
  }

  try {
    const body = await request.json();
    
    // Validasi Skema Input Sintaksis (Mencegah Masalah 1)
    if (!body || typeof body.text !== "string" || body.text.trim() === "") {
      return json({ error: "Bad Request. Input teks tidak valid." }, { status: 400, headers: responseHeaders });
    }

    // Pembersihan teks dasar dari karakter injeksi berbahaya
    const sanitizedText = body.text.replace(/[<>:"']/g, "").substring(0, 500); 
    const targetLang = typeof body.targetLanguage === "string" ? body.targetLanguage.replace(/[<>:"']/g, "") : "Bahasa Jepang/Indonesia";

    const apiKey = context?.env?.GEMINI_API_KEY || (globalThis as any).process?.env?.GEMINI_API_KEY;
    if (!apiKey) {
      return json({ error: "Kredensial AI tidak terkonfigurasi." }, { status: 500, headers: responseHeaders });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Kamu adalah fitur translator profesional di aplikasi Nihongolevel. Terjemahkan teks berikut ke ${targetLang}. Berikan juga cara baca Romaji, huruf Kana/Kanji yang tepat, beserta penjelasan tata bahasa singkat jika diperlukan. Teks untuk diterjemahkan: "${sanitizedText}"`
          }]
        }]
      })
    });

    const data = await geminiResponse.json();
    if (data.error) {
      return json({ error: data.error.message }, { status: 400, headers: responseHeaders });
    }

    const translatedText = data.candidates[0].content.parts[0].text;

    return json({ 
      text: translatedText,
      translation: translatedText,
      result: translatedText,
      response: translatedText
    }, { headers: responseHeaders });

  } catch (error: any) {
    return json({ error: error.message }, { status: 500, headers: responseHeaders });
  }
}
