// ... (Bagian atas file sama seperti sebelumnya) ...

        // Direct fetch to Gemini API dengan Timeout
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout 15 detik

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal, // Menambahkan pengatur waktu
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
              }),
            }
          );
          clearTimeout(timeoutId);

          const result = await response.json();
          if (!response.ok) {
            console.error("Gemini Error:", result);
            return jsonResponse({ error: "AI_API_ERROR" }, 502, allowedOrigin);
          }

          const rawText = result.candidates[0].content.parts[0].text;
          const cleanedText = rawText.replace(/```json/g, "").replace(/
```/g, "").trim();
          
          return new Response(cleanedText, {
            headers: { "Content-Type": "application/json", ...allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {} },
          });

        } catch (e: any) {
          if (e.name === 'AbortError') {
             console.error("Fetch timeout!");
             return jsonResponse({ error: "AI_TIMEOUT" }, 504, allowedOrigin);
          }
          console.error("Translation failed:", e);
          return jsonResponse({ error: "AI_UNAVAILABLE" }, 502, allowedOrigin);
        }
// ...