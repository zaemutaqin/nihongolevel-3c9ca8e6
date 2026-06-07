import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type KeyboardEvent } from "react";
import { Loader2, ChevronDown, AlertCircle, Sparkles } from "lucide-react";
import {
  translateSentence,
  type TranslationResult,
} from "@/lib/translate.functions";
import { cn } from "@/lib/utils";
import {
  IntentBadge,
  SocialAnalysisCard,
  LevelCard,
  MostNaturalCard,
  AlternativesSection,
} from "@/components/result-parts";
import {
  addHistory,
  addFavoriteFromLevel,
  addFavoriteFromMostNatural,
  isFavorited,
  type HistoryEntry,
  type LevelKey,
} from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NihongoLevel — Belajar Bahasa Jepang per Level JLPT" },
      {
        name: "description",
        content:
          "Terjemahkan kalimat Bahasa Indonesia ke Bahasa Jepang dalam 4 tingkat JLPT (N4–N1) dengan analisis sosial dan alternatif sesuai konteks.",
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

const LEVELS: { key: LevelKey; label: string }[] = [
  { key: "n4", label: "N4" },
  { key: "n3", label: "N3" },
  { key: "n2", label: "N2" },
  { key: "n1", label: "N1" },
];

const LISTENER_OPTIONS = [
  { value: "", label: "Belum tahu / tidak relevan" },
  { value: "Diri sendiri", label: "Diri sendiri" },
  { value: "Teman dekat / sebaya", label: "Teman dekat / sebaya" },
  { value: "Rekan kerja / kolega", label: "Rekan kerja / kolega" },
  { value: "Atasan / senior", label: "Atasan / senior" },
  { value: "Klien / orang baru", label: "Klien / orang baru" },
  { value: "Orang yang lebih muda", label: "Orang yang lebih muda" },
];

const MOOD_OPTIONS = [
  { value: "", label: "Percakapan biasa" },
  { value: "Santai / sedang bercanda", label: "Santai / sedang bercanda" },
  { value: "Serius / penting", label: "Serius / penting" },
  { value: "Sedang emosi / kesal", label: "Sedang emosi / kesal" },
  { value: "Senang / antusias", label: "Senang / antusias" },
  { value: "Canggung / tidak nyaman", label: "Canggung / tidak nyaman" },
];

function Index() {
  const translate = useServerFn(translateSentence);
  const [input, setInput] = useState("");
  const [listener, setListener] = useState("");
  const [mood, setMood] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [historyEntry, setHistoryEntry] = useState<HistoryEntry | null>(null);
  const [favTick, setFavTick] = useState(0);
  const [open, setOpen] = useState<Record<LevelKey, boolean>>({
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
    setHistoryEntry(null);
    try {
      const data = await translate({
        data: { sentence, listener: listener || undefined, mood: mood || undefined },
      });
      setResult(data);
      const entry = addHistory(sentence, data);
      setHistoryEntry(entry);
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

  const favMostNatural = historyEntry
    ? isFavorited(historyEntry.id, "most_natural")
    : false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Gemini
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight sm:hidden">
          Nihongo<span className="text-primary">Level</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Belajar berbicara seperti orang Jepang</p>
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

        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setContextOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/40 transition"
            aria-expanded={contextOpen}
          >
            <span>Tambah konteks (opsional)</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                contextOpen && "rotate-180",
              )}
            />
          </button>
          {contextOpen && (
            <div className="px-3 pb-3 grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                  Kepada siapa kamu berbicara?
                </label>
                <select
                  value={listener}
                  onChange={(e) => setListener(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                >
                  {LISTENER_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                  Bagaimana suasananya?
                </label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                >
                  {MOOD_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

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
                Mencari...
              </>
            ) : (
              "Cari ekspresi"
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
          <p className="text-sm">Sedang mencari ekspresi yang tepat...</p>
        </div>
      )}

      {result && historyEntry && (
        <div className="mt-8 space-y-6" key={favTick}>
          <h2 className="text-base font-bold text-foreground">
            Bagaimana orang Jepang mengatakannya
          </h2>
          <IntentBadge intent={result.intent} />
          {result.social_analysis && <SocialAnalysisCard data={result.social_analysis} />}
          <MostNaturalCard
            data={result.most_natural}
            isFav={favMostNatural}
            onFavorite={() => {
              addFavoriteFromMostNatural(historyEntry);
              setFavTick((t) => t + 1);
            }}
          />
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground/80">
              Pilihan ekspresi berdasarkan gaya komunikasi
            </h3>
            <div className="space-y-4">
              {LEVELS.map(({ key, label }) => (
                <LevelCard
                  key={key}
                  level={label}
                  data={result[key]}
                  open={open[key]}
                  onToggle={() => setOpen((s) => ({ ...s, [key]: !s[key] }))}
                  isFav={isFavorited(historyEntry.id, "level", label)}
                  onFavorite={() => {
                    addFavoriteFromLevel(historyEntry, key);
                    setFavTick((t) => t + 1);
                  }}
                />
              ))}
            </div>
          </section>
          {result.alternatives?.length > 0 && (
            <AlternativesSection items={result.alternatives} />
          )}
        </div>
      )}

      <footer className="mt-16 pb-6 text-center text-xs text-muted-foreground">
        Dibuat untuk belajar bahasa Jepang ✿
      </footer>
    </div>
  );
}
