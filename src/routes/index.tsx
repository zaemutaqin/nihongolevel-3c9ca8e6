import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type KeyboardEvent } from "react";
import { Loader2, ChevronDown, AlertCircle, Sparkles } from "lucide-react";
import { translateSentence, type TranslationResult, type LevelBlock } from "@/lib/translate.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NihongoLevel — Belajar Bahasa Jepang per Level JLPT" },
      {
        name: "description",
        content:
          "Terjemahkan kalimat Bahasa Indonesia ke Bahasa Jepang dalam 4 tingkat JLPT (N4–N1) dengan penjelasan tata bahasa dan kanji.",
      },
      { property: "og:title", content: "NihongoLevel — Belajar Bahasa Jepang per Level JLPT" },
      {
        property: "og:description",
        content:
          "Terjemahkan kalimat Bahasa Indonesia ke Bahasa Jepang dalam 4 tingkat JLPT (N4–N1).",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: Index,
});

const EXAMPLES = [
  "hari ini makan apa ya?",
  "Boleh saya pulang lebih awal?",
  "Saya tidak bisa hadir rapat besok",
  "Terima kasih sudah membantu",
];

type Level = "n4" | "n3" | "n2" | "n1";

const LEVELS: { key: Level; label: string; tone: string }[] = [
  { key: "n4", label: "N4", tone: "level-n4" },
  { key: "n3", label: "N3", tone: "level-n3" },
  { key: "n2", label: "N2", tone: "level-n2" },
  { key: "n1", label: "N1", tone: "level-n1" },
];

function Index() {
  const translate = useServerFn(translateSentence);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [open, setOpen] = useState<Record<Level, boolean>>({
    n4: true,
    n3: false,
    n2: false,
    n1: false,
  });

  const handleTranslate = async (text?: string) => {
    const sentence = (text ?? input).trim();
    if (!sentence) {
      setError("Silakan masukkan kalimat terlebih dahulu.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const data = await translate({ data: { sentence } });
      setResult(data);
      setOpen({ n4: true, n3: false, n2: false, n1: false });
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error
          ? `Gagal menerjemahkan: ${e.message}`
          : "Gagal menerjemahkan kalimat. Coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleTranslate();
    }
  };

  const useExample = (ex: string) => {
    setInput(ex);
    handleTranslate(ex);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Gemini
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Nihongo<span className="text-primary">Level</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Belajar Bahasa Jepang per Level JLPT
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <label htmlFor="input" className="block text-sm font-medium mb-2">
            Kalimat Bahasa Indonesia
          </label>
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Tulis kalimat di sini... (Ctrl+Enter untuk terjemahkan)"
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          />

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Tekan <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground/80">Ctrl</kbd> +{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground/80">Enter</kbd>
            </p>
            <button
              onClick={() => handleTranslate()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menerjemahkan...
                </>
              ) : (
                "Terjemahkan"
              )}
            </button>
          </div>

          <div className="mt-5">
            <p className="text-xs text-muted-foreground mb-2">Contoh cepat:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => useExample(ex)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {loading && !result && (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Sedang menerjemahkan ke 4 level JLPT...</p>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-4">
            {LEVELS.map(({ key, label, tone }) => (
              <LevelCard
                key={key}
                level={label}
                tone={tone}
                data={result[key]}
                open={open[key]}
                onToggle={() => setOpen((s) => ({ ...s, [key]: !s[key] }))}
              />
            ))}
          </div>
        )}

        <footer className="mt-16 pb-6 text-center text-xs text-muted-foreground">
          Dibuat untuk belajar bahasa Jepang ✿
        </footer>
      </div>
    </div>
  );
}

function LevelCard({
  level,
  tone,
  data,
  open,
  onToggle,
}: {
  level: string;
  tone: string;
  data: LevelBlock;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card shadow-sm overflow-hidden", `border-${tone}/30`)}
      style={{ borderColor: `var(--${tone})` + "40" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center min-w-12 h-7 px-2.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: `var(--${tone})` }}
          >
            {level}
          </span>
          <span className="font-jp text-lg sm:text-xl text-foreground line-clamp-1 text-left">
            {data.japanese}
          </span>
        </div>
        <ChevronDown
          className={cn("w-5 h-5 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 space-y-5">
          <div>
            <p className="font-jp text-2xl sm:text-3xl leading-snug text-foreground">
              {data.japanese}
            </p>
            <p className="mt-2 italic text-sm text-muted-foreground">{data.romaji}</p>
          </div>

          <div className="rounded-lg bg-muted/60 p-3 text-sm text-foreground/80">
            <span className="font-medium text-foreground">Nuansa: </span>
            {data.nuance}
          </div>

          {data.grammar?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Tata Bahasa</h3>
              <ul className="space-y-2">
                {data.grammar.map((g, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-border p-3 text-sm"
                  >
                    <p className="font-jp font-medium text-foreground">{g.pattern}</p>
                    <p className="mt-1 text-muted-foreground">{g.explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.kanji?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Kanji</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.kanji.map((k, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-background p-3 flex flex-col"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-jp text-4xl font-bold text-foreground leading-none">
                        {k.char}
                      </span>
                      <span
                        className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `var(--level-${(k.jlpt || "N4").toLowerCase()})`,
                        }}
                      >
                        {k.jlpt}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground font-jp">{k.reading}</p>
                    <p className="mt-1 text-xs font-medium text-foreground">{k.meaning}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground font-jp">{k.examples}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
