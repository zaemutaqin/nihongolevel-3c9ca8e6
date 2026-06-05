import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type KeyboardEvent } from "react";
import {
  Loader2,
  ChevronDown,
  AlertCircle,
  Sparkles,
  Star,
  Users,
  Heart,
  Target,
  AlertTriangle,
} from "lucide-react";
import {
  translateSentence,
  type TranslationResult,
  type LevelBlock,
  type IntentInfo,
  type IntentType,
  type Naturalness,
  type MostNatural,
  type SocialAnalysis,
  type AlternativeExpression,
} from "@/lib/translate.functions";
import { cn } from "@/lib/utils";

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

type Level = "n4" | "n3" | "n2" | "n1";

const LEVELS: { key: Level; label: string; tone: string }[] = [
  { key: "n4", label: "N4", tone: "level-n4" },
  { key: "n3", label: "N3", tone: "level-n3" },
  { key: "n2", label: "N2", tone: "level-n2" },
  { key: "n1", label: "N1", tone: "level-n1" },
];

const INTENT_LABELS: Record<IntentType, { emoji: string; label: string }> = {
  monolog: { emoji: "🧠", label: "Monolog / berpikir sendiri" },
  asking_others: { emoji: "💬", label: "Tanya ke orang lain" },
  casual_conversation: { emoji: "🤝", label: "Percakapan kasual / akrab" },
  professional_formal: { emoji: "💼", label: "Konteks profesional / formal" },
  joking_relaxed: { emoji: "😄", label: "Bercanda / santai" },
};

const NATURALNESS_LABELS: Record<
  Naturalness,
  { emoji: string; label: string; tone: string }
> = {
  native: { emoji: "✅", label: "Native-like", tone: "nat-native" },
  stiff: { emoji: "⚠️", label: "Correct but stiff", tone: "nat-stiff" },
  textbook: { emoji: "❌", label: "Textbook only", tone: "nat-textbook" },
};

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
      const data = await translate({
        data: { sentence, listener: listener || undefined, mood: mood || undefined },
      });
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
          <p className="mt-3 text-muted-foreground">Belajar Bahasa Jepang per Level JLPT</p>
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
          <>
            <IntentBadge intent={result.intent} />
            {result.social_analysis && <SocialAnalysisCard data={result.social_analysis} />}
            <div className="mt-6 space-y-4">
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
            <MostNaturalCard data={result.most_natural} />
            {result.alternatives?.length > 0 && (
              <AlternativesSection items={result.alternatives} />
            )}
          </>
        )}

        <footer className="mt-16 pb-6 text-center text-xs text-muted-foreground">
          Dibuat untuk belajar bahasa Jepang ✿
        </footer>
      </div>
    </div>
  );
}

function IntentBadge({ intent }: { intent: IntentInfo }) {
  const meta = INTENT_LABELS[intent.type] ?? { emoji: "✨", label: intent.type };
  const color = `var(--intent-${intent.type})`;
  return (
    <div
      className="mt-8 rounded-2xl border p-4 sm:p-5"
      style={{ borderColor: color + "55", backgroundColor: color + "12" }}
    >
      <div
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        <span>{meta.emoji}</span>
        <span>{meta.label}</span>
      </div>
      <p className="mt-2 text-sm text-foreground/80">{intent.explanation}</p>
    </div>
  );
}

function SocialAnalysisCard({ data }: { data: SocialAnalysis }) {
  const rows: { icon: typeof Users; label: string; value: string }[] = [
    { icon: Users, label: "Hubungan sosial", value: data.relationship },
    { icon: Heart, label: "Emosi / tone", value: data.emotion },
    { icon: Target, label: "Tujuan komunikasi", value: data.communication_goal },
    { icon: AlertTriangle, label: "Risiko salah konteks", value: data.wrong_context_risk },
  ];
  return (
    <div
      className="mt-4 rounded-2xl border bg-card shadow-sm p-5"
      style={{ borderLeft: "4px solid var(--intent-asking_others)" }}
    >
      <h2 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground/80">
        Analisis Situasi
      </h2>
      <ul className="space-y-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-start gap-3">
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="text-sm text-muted-foreground">{value}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NaturalnessChip({ value }: { value: Naturalness }) {
  const meta = NATURALNESS_LABELS[value] ?? NATURALNESS_LABELS.stiff;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: `var(--${meta.tone})` }}
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
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
  const [whyOpen, setWhyOpen] = useState(false);
  return (
    <div
      className="rounded-2xl border bg-card shadow-sm overflow-hidden"
      style={{ borderColor: `var(--${tone})` + "40" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
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
            <div className="mt-3">
              <NaturalnessChip value={data.naturalness} />
              {data.naturalness_note && (
                <p className="mt-1.5 text-xs text-muted-foreground">{data.naturalness_note}</p>
              )}
            </div>
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
                  <li key={i} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-jp font-medium text-foreground">{g.pattern}</p>
                    <p className="mt-1 text-muted-foreground">{g.explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.why_this_level && (
            <div className="rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setWhyOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold hover:bg-muted/40 transition"
                aria-expanded={whyOpen}
              >
                <span>Kenapa level ini?</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    whyOpen && "rotate-180",
                  )}
                />
              </button>
              {whyOpen && (
                <p className="px-3 pb-3 text-sm text-muted-foreground">{data.why_this_level}</p>
              )}
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

function MostNaturalCard({ data }: { data: MostNatural }) {
  const tone = `level-${(data.level || "N3").toLowerCase()}`;
  return (
    <div
      className="mt-8 rounded-2xl border-2 p-5 sm:p-6 shadow-md"
      style={{
        borderColor: `var(--${tone})`,
        background: `linear-gradient(135deg, color-mix(in oklab, var(--${tone}) 12%, transparent), color-mix(in oklab, var(--${tone}) 4%, transparent))`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4" style={{ color: `var(--${tone})` }} fill="currentColor" />
        <h2
          className="text-sm font-bold uppercase tracking-wide"
          style={{ color: `var(--${tone})` }}
        >
          Yang paling natural diucapkan orang Jepang
        </h2>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="inline-flex items-center justify-center min-w-12 h-7 px-2.5 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: `var(--${tone})` }}
        >
          {data.level}
        </span>
      </div>
      <p className="mt-3 font-jp text-2xl sm:text-3xl leading-snug text-foreground">
        {data.japanese}
      </p>
      <p className="mt-1 italic text-sm text-muted-foreground">{data.romaji}</p>
      <p className="mt-3 text-sm text-foreground/80">{data.reason}</p>
    </div>
  );
}

function AlternativesSection({ items }: { items: AlternativeExpression[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground/80">
        Alternatif ekspresi sesuai situasi
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((alt, i) => {
          const tone = `level-${(alt.level || "N3").toLowerCase()}`;
          return (
            <div
              key={i}
              className="rounded-2xl border bg-card p-4 shadow-sm flex flex-col"
              style={{ borderColor: `var(--${tone})` + "40" }}
            >
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                {alt.context_label}
              </p>
              <p className="font-jp text-xl leading-snug text-foreground">{alt.japanese}</p>
              <p className="mt-1 italic text-xs text-muted-foreground">{alt.romaji}</p>
              <div className="mt-2">
                <span
                  className="inline-flex items-center justify-center min-w-10 h-6 px-2 rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: `var(--${tone})` }}
                >
                  {alt.level}
                </span>
              </div>
              <p className="mt-2 text-xs text-foreground/80">{alt.explanation}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
