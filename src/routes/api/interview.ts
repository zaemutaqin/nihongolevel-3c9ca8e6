import { createAPIFileRoute } from '@tanstack/start/api';

export const APIRoute = createAPIFileRoute('/api/interview')({
  POST: async ({ request }) => {
    // Kita paksakan status 200 (Sukses) agar pesan error tidak dicegat oleh peringatan merah frontend
    const responseHeaders = new Headers({ "Content-Type": "application/json" });
    
    try {
      const body = await request.json() as { message?: string };
      
      // 1. Cek keberadaan API Key di sistem Lovable
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || (globalThis as any).process?.env?.GEMINI_API_KEY;
      if (!apiKey) {
        const pesanEror = "⚠️ LAPORAN SERVER: Kunci GEMINI_API_KEY kamu ternyata kosong atau belum terbaca oleh sistem Lovable. Coba cek menu Secrets/Environment di dashboard Lovable.";
        return new Response(JSON.stringify({ reply: pesanEror, response: pesanEror }), { status: 200, headers: responseHeaders });
      }

      // 2. Tembak langsung ke server Google Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: body.message || "Test" }] }]
          })
        }
      );

      const data = await response.json() as any;
      
      // 3. Tangkap jika Google Gemini menolak koneksi (misal: API Key salah)
      if (data.error) {
        const pesanEror = `⚠️ LAPORAN GOOGLE: ${data.error.message}`;
        return new Response(JSON.stringify({ reply: pesanEror, response: pesanEror }), { status: 200, headers: responseHeaders });
      }

      const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sukses, tapi Gemini merespons kosong.";
      return new Response(JSON.stringify({ reply: aiReply, response: aiReply }), { status: 200, headers: responseHeaders });

    } catch (error: any) {
      // 4. Tangkap jika kode servernya yang crash
      const pesanEror = `⚠️ LAPORAN KODE: ${error.message}`;
      return new Response(JSON.stringify({ reply: pesanEror, response: pesanEror }), { status: 200, headers: responseHeaders });
    }
  }
});
