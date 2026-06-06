import { Star } from "lucide-react";
import type {
  LevelBlock,
  IntentInfo,
  IntentType,
  Naturalness,
  MostNatural,
  AlternativeExpression,
  SocialAnalysis,
} from "@/lib/translate.functions";
import { useState } from "react";
import { ChevronDown, Users, Heart, Target, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const INTENT_LABELS: Record<IntentType, { emoji: string; label: string; short: string }> = {
  monolog: { emoji: "🧠", label: "Monolog / berpikir sendiri", short: "Monolog" },
  asking_others: { emoji: "💬", label: "Tanya ke orang lain", short: "Tanya ke orang" },
  casual_conversation: { emoji: "🤝", label: "Percakapan kasual / akrab", short: "Kasual" },
  professional_formal: { emoji: "💼", label: "Konteks profesional / formal", short: "Profesional" },
  joking_relaxed: { emoji: "😄", label: "Bercanda / santai", short: "Bercanda" },
};

export const NATURALNESS_LABELS: Record<
  Naturalness,
  { emoji: string; label: string; tone: string }
> = {
  native: { emoji: "✅", label: "Native-like", tone: "nat-native" },
  stiff: { emoji: "⚠️", label: "Correct but stiff", tone: "nat-stiff" },
  textbook: { emoji: "❌", label: "Textbook only", tone: "nat-textbook" },
};

export function IntentBadge({ intent }: { intent: IntentInfo }) {
  const meta = INTENT_LABELS[intent.type] ?? { emoji: "✨", label: intent.type, short: intent.type };
  const color = `var(--intent-${intent.type})`;
  return (
    <div
      className="rounded-2xl border p-4 sm:p-5"
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

export function IntentChip({ intent }: { intent: IntentInfo }) {
  const meta = INTENT_LABELS[intent.type] ?? { emoji: "✨", label: intent.type, short: intent.type };
  const color = `var(--intent-${intent.type})`;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      <span>{meta.emoji}</span>
      <span>{meta.short}</span>
    </span>
  );
}

export function SocialAnalysisCard({ data }: { data: SocialAnalysis }) {
  const rows = [
    { Icon: Users, label: "Hubungan sosial", value: data.relationship },
    { Icon: Heart, label: "Emosi / tone", value: data.emotion },
    { Icon: Target, label: "Tujuan komunikasi", value: data.communication_goal },
    { Icon: AlertTriangle, label: "Risiko salah konteks", value: data.wrong_context_risk },
  ];
  return (
    <div
      className="rounded-2xl border bg-card shadow-sm p-5"
      style={{ borderLeft: "4px solid var(--intent-asking_others)" }}
    >
      <h2 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground/80">
        Analisis Situasi
      </h2>
      <ul className="space-y-3">
        {rows.map(({ Icon, label, value }) => (
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

export function NaturalnessChip({ value }: { value: Naturalness }) {
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

export function LevelCard({
  level,
  data,
  open,
  onToggle,
  onFavorite,
  isFav,
}: {
  level: string;
  data: LevelBlock;
  open: boolean;
  onToggle: () => void;
  onFavorite?: () => void;
  isFav?: boolean;
}) {
  const tone = `level-${level.toLowerCase()}`;
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
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <NaturalnessChip value={data.naturalness} />
              {onFavorite && (
                <button
                  onClick={onFavorite}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition",
                    isFav
                      ? "bg-amber-100 border-amber-300 text-amber-800"
                      : "bg-background border-border text-foreground hover:bg-muted",
                  )}
                >
                  <Star className="w-3 h-3" fill={isFav ? "currentColor" : "none"} />
                  {isFav ? "Tersimpan" : "Simpan favorit"}
                </button>
              )}
            </div>
            {data.naturalness_note && (
              <p className="mt-1.5 text-xs text-muted-foreground">{data.naturalness_note}</p>
            )}
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

export function MostNaturalCard({
  data,
  onFavorite,
  isFav,
}: {
  data: MostNatural;
  onFavorite?: () => void;
  isFav?: boolean;
}) {
  const tone = `level-${(data.level || "N3").toLowerCase()}`;
  return (
    <div
      className="rounded-2xl border-2 p-5 sm:p-6 shadow-md"
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
        {onFavorite && (
          <button
            onClick={onFavorite}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition",
              isFav
                ? "bg-amber-100 border-amber-300 text-amber-800"
                : "bg-background border-border text-foreground hover:bg-muted",
            )}
          >
            <Star className="w-3 h-3" fill={isFav ? "currentColor" : "none"} />
            {isFav ? "Tersimpan" : "Simpan favorit"}
          </button>
        )}
      </div>
      <p className="mt-3 font-jp text-2xl sm:text-3xl leading-snug text-foreground">
        {data.japanese}
      </p>
      <p className="mt-1 italic text-sm text-muted-foreground">{data.romaji}</p>
      <p className="mt-3 text-sm text-foreground/80">{data.reason}</p>
    </div>
  );
}

export function AlternativesSection({ items }: { items: AlternativeExpression[] }) {
  return (
    <section>
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
