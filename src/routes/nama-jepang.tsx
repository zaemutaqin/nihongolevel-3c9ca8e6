import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, Loader2, Sparkles, Mic } from "lucide-react";
import { useT } from "@/lib/i18n";
import { HanashiteTeaserBanner } from "@/components/HanashiteTeaserBanner";

export const Route = createFileRoute("/nama-jepang")({
  head: () => ({
    meta: [
      { title: "Generator Nama Jepang — Ubah Namamu ke Katakana & Kanji | NihongoLevel" },
      {
        name: "description",
        content:
          "Ubah namamu ke huruf Katakana + saran Kanji (Ateji) yang punya makna positif. Hasilkan kartu nama Jepang (Meishi) yang bisa di-download dan dibagikan.",
      },
      { property: "og:title", content: "Generator Nama Jepang — Katakana & Kanji" },
      {
        property: "og:description",
        content: "Ubah namamu ke huruf Jepang dan dapat kartu Meishi siap share ke media sosial.",
      },
    ],
    links: [{ rel: "canonical", href: "/nama-jepang" }],
  }),
  component: NameGenerator,
});

type Ateji = { kanji: string; reading: string; meaning: string };
type Result = { katakana: string; romaji: string; ateji: Ateji[]; fun_fact: string };

// Flat-design Meishi palette (3 solid colors, no gradients/shadows)
const PALETTE = {
  bg: "#FFF8EC",
  ink: "#1A1A1A",
  accent: "#E94F37",
};

function buildMeishiSVG(name: string, r: Result, atejiIdx: number): string {
  const ateji = r.ateji[atejiIdx];
  const safe = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480">
  <rect width="800" height="480" fill="${PALETTE.bg}"/>
  <rect x="0" y="0" width="14" height="480" fill="${PALETTE.accent}"/>
  <rect x="48" y="48" width="704" height="2" fill="${PALETTE.ink}" opacity="0.15"/>
  <text x="48" y="42" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="700" fill="${PALETTE.ink}" letter-spacing="2">名刺  ·  MEISHI</text>
  <text x="48" y="160" font-family="'Noto Sans JP', sans-serif" font-size="110" font-weight="900" fill="${PALETTE.ink}">${safe(r.katakana)}</text>
  <text x="48" y="200" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="500" fill="${PALETTE.ink}" opacity="0.6">${safe(r.romaji)}</text>
  <text x="48" y="290" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="700" fill="${PALETTE.accent}" letter-spacing="3">ATEJI · 当て字</text>
  <text x="48" y="370" font-family="'Noto Sans JP', serif" font-size="84" font-weight="900" fill="${PALETTE.ink}">${safe(ateji.kanji)}</text>
  <text x="48" y="400" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="500" fill="${PALETTE.ink}" opacity="0.75">${safe(ateji.reading)} — ${safe(ateji.meaning)}</text>
  <text x="752" y="450" text-anchor="end" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="700" fill="${PALETTE.ink}" opacity="0.5">${safe(name)}  ·  nihongolevel.lovable.app</text>
</svg>`;
}

function downloadSVG(svg: string, filename: string) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPNG(svg: string, filename: string) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 960;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, 1600, 960);
  URL.revokeObjectURL(url);
  const png = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = png;
  a.download = filename;
  a.click();
}

function NameGenerator() {
  const { lang } = useT();
  const isId = lang === "id";
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [atejiIdx, setAtejiIdx] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  const generate = async () => {
    const n = name.trim();
    if (!n) {
      setError(isId ? "Masukkan namamu dulu." : "Enter your name first.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    setAtejiIdx(0);
    try {
      const res = await fetch("/api/nama-jepang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, lang }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "AI_UNAVAILABLE");
      }
      const j = await res.json();
      if (!j?.result?.katakana || !Array.isArray(j.result.ateji) || j.result.ateji.length === 0) {
        throw new Error("INVALID_RESPONSE");
      }
      setResult(j.result);
    } catch (e) {
      setError(
        isId
          ? "Gagal membuat nama. Coba lagi sebentar."
          : "Failed to generate. Try again in a moment.",
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const svg = result ? buildMeishiSVG(name.trim(), result, atejiIdx) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          {isId ? "Generator Nama" : "Name Generator"}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {isId ? "Ubah Namamu ke Bahasa Jepang" : "Convert Your Name to Japanese"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
          {isId
            ? "Ubah namamu ke Katakana, dapat saran Kanji (Ateji) bermakna positif, lalu unduh sebagai kartu Meishi."
            : "Convert your name to Katakana, get meaningful Kanji (Ateji) suggestions, and download as a Meishi card."}
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          {isId ? "Nama kamu" : "Your name"}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder={isId ? "Contoh: Zaenal" : "Example: Sarah"}
            maxLength={40}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isId ? "Membuat..." : "Generating..."}
              </>
            ) : (
              isId ? "Ubah" : "Generate"
            )}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </section>

      {result && svg && (
        <section className="mt-8">
          <div
            ref={previewRef}
            className="rounded-2xl overflow-hidden border border-border shadow-sm bg-white"
            dangerouslySetInnerHTML={{ __html: svg }}
          />

          <div className="mt-4 grid sm:grid-cols-3 gap-2">
            {result.ateji.map((a, i) => (
              <button
                key={i}
                onClick={() => setAtejiIdx(i)}
                className={`text-left rounded-xl border p-3 transition ${
                  i === atejiIdx
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="text-2xl font-bold">{a.kanji}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.reading}</div>
                <div className="text-xs mt-1 line-clamp-2">{a.meaning}</div>
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm text-muted-foreground italic">{result.fun_fact}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => downloadPNG(svg, `meishi-${name.trim()}.png`)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
            >
              <Download className="w-4 h-4" />
              {isId ? "Download PNG" : "Download PNG"}
            </button>
            <button
              onClick={() => downloadSVG(svg, `meishi-${name.trim()}.svg`)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition"
            >
              <Download className="w-4 h-4" />
              SVG
            </button>
          </div>

          <div className="mt-8 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">
                  {isId
                    ? "Kenalin namamu pakai bahasa Jepang yuk!"
                    : "Introduce yourself in Japanese!"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {isId
                    ? `Coba bilang "${result.katakana}-desu" di Hanashite Room. Gratis 1 skenario.`
                    : `Try saying "${result.katakana}-desu" in Hanashite Room. 1 free scenario.`}
                </p>
                <Link
                  to="/"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
                >
                  {isId ? "Mulai Berlatih" : "Start Practice"}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <HanashiteTeaserBanner />
    </div>
  );
}
