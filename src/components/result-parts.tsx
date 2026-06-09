import { Star } from "lucide-react";
import type {
  LevelBlock,
  IntentInfo,
  IntentType,
  Naturalness,
  MostNatural,
  AlternativeExpression,
  SocialAnalysis,
  KanjiInfo,
} from "@/lib/translate.functions";
import { cleanJapanese } from "@/lib/translate.functions";
import { useState } from "react";
import { ChevronDown, Users, Heart, Target, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpeakerButton } from "@/components/SpeakerButton";
import { useT } from "@/lib/i18n";

export { cleanJapanese };

// Backwards-compat (Indonesian fallback). Prefer useIntentLabel inside components.
export const INTENT_LABELS: Record<IntentType, { emoji: string; label: string; short: string }> = {
  monolog: { emoji: "🧠", label: "Monolog", short: "Monolog" },
  asking_others: { emoji: "💬", label: "Asking", short: "Asking" },
  casual_conversation: { emoji: "🤝", label: "Casual", short: "Casual" },
  professional_formal: { emoji: "💼", label: "Professional", short: "Professional" },
  joking_relaxed: { emoji: "😄", label: "Joking", short: "Joking" },
};

const INTENT_EMOJI: Record<IntentType, string> = {
  monolog: "🧠",
  asking_others: "💬",
  casual_conversation: "🤝",
  professional_formal: "💼",
  joking_relaxed: "😄",
};

export function useIntentLabel(type: IntentType) {
  const { t } = useT();
  return {
    emoji: INTENT_EMOJI[type] ?? "✨",
    label: t(`intent.${type}`),
    short: t(`intent.${type}_short`),
  };
}

export const NATURALNESS_LABELS: Record<
  Naturalness,
  { emoji: string; label: string; tone: string }
> = {
  native: { emoji: "✅", label: "Native-like", tone: "nat-native" },
  stiff: { emoji: "⚠️", label: "Correct but stiff", tone: "nat-stiff" },
  textbook: { emoji: "❌", label: "Textbook only", tone: "nat-textbook" },
};

export const STYLE_BY_LEVEL: Record<string, { tone: string }> = {
  N4: { tone: "level-n4" },
  N3: { tone: "level-n3" },
  N2: { tone: "level-n2" },
  N1: { tone: "level-n1" },
};

export function styleMeta(level: string) {
  return STYLE_BY_LEVEL[level?.toUpperCase()] ?? { tone: "level-n3" };
}

export function StylePill({ level, size = "md" }: { level: string; size?: "sm" | "md" }) {
  const meta = styleMeta(level);
  const { t } = useT();
  const key = (level || "").toUpperCase();
  const name = t(`style.${key}`) || key;
  const sizeCls = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-3 py-1";
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full font-semibold", sizeCls)}
      style={{
        backgroundColor: `color-mix(in oklab, var(--${meta.tone}) 14%, transparent)`,
        color: `var(--${meta.tone})`,
        border: `1px solid color-mix(in oklab, var(--${meta.tone}) 35%, transparent)`,
      }}
    >
      {name}
    </span>
  );
}

export function JlptRef({ level, className }: { level: string; className?: string }) {
  const { t } = useT();
  return (
    <span className={cn("text-[11px] text-muted-foreground", className)}>
      {t("style.equiv")} {level?.toUpperCase()}
    </span>
  );
}

export function IntentBadge({ intent }: { intent: IntentInfo }) {
  const meta = useIntentLabel(intent.type);
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
  const meta = useIntentLabel(intent.type);
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
  const { t } = useT();
  const rows = [
    { Icon: Users, label: t("sa.relationship"), value: data.relationship },
    { Icon: Heart, label: t("sa.emotion"), value: data.emotion },
    { Icon: Target, label: t("sa.goal"), value: data.communication_goal },
    { Icon: AlertTriangle, label: t("sa.risk"), value: data.wrong_context_risk },
  ];
  return (
    <div
      className="rounded-2xl border bg-card shadow-sm p-5"
      style={{ borderLeft: "4px solid var(--intent-asking_others)" }}
    >
      <h2 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground/80">
        {t("sa.title")}
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

// ============= Naturalness =============
const NATURALNESS_BAR: Record<
  Naturalness,
  { filled: 1 | 2 | 3; key: string; color: string; track: string }
> = {
  native: { filled: 3, key: "nat.native", color: "bg-green-500", track: "bg-green-500/15" },
  stiff: { filled: 2, key: "nat.stiff", color: "bg-amber-500", track: "bg-amber-500/15" },
  textbook: { filled: 1, key: "nat.textbook", color: "bg-red-400", track: "bg-red-400/15" },
};

export function NaturalnessBar({
  value,
  compact = false,
}: {
  value: Naturalness;
  compact?: boolean;
}) {
  const { t } = useT();
  const meta = NATURALNESS_BAR[value] ?? NATURALNESS_BAR.stiff;
  return (
    <div className="w-full">
      {!compact && (
        <p className="text-[11px] font-medium text-muted-foreground mb-1">
          {t("nat.label")}
        </p>
      )}
      <div className={cn("flex gap-1 w-full rounded-full overflow-hidden", "h-1.5")}>
        {[1, 2, 3].map((seg) => (
          <div
            key={seg}
            className={cn(
              "flex-1 rounded-full",
              seg <= meta.filled ? meta.color : meta.track,
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] font-semibold text-foreground/80">{t(meta.key)}</p>
    </div>
  );
}

// Deprecated text chip — kept exported for backward-compat
export function NaturalnessChip({ value }: { value: Naturalness }) {
  const { t } = useT();
  const meta = NATURALNESS_LABELS[value] ?? NATURALNESS_LABELS.stiff;
  const labelKey = value === "native" ? "nat.native" : value === "stiff" ? "nat.stiff" : "nat.textbook";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: `var(--${meta.tone})` }}
    >
      <span>{meta.emoji}</span>
      <span>{t(labelKey)}</span>
    </span>
  );
}

// ============= Kanji =============
const FREQ_LABEL: Record<string, string> = {
  sangat_umum: "Sangat Umum",
  umum: "Umum",
  khusus: "Khusus",
};

function kanjiFrequency(k: KanjiInfo): "sangat_umum" | "umum" | "khusus" {
  if (k.frequency) return k.frequency;
  const j = (k.jlpt || "").toUpperCase();
  if (j === "N5" || j === "N4") return "sangat_umum";
  if (j === "N3") return "umum";
  return "khusus";
}

export function KanjiCard({ k }: { k: KanjiInfo }) {
  const freq = kanjiFrequency(k);
  const jlpt = (k.jlpt || "N4").toUpperCase();
  return (
    <div className="rounded-xl border border-border bg-background p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <span
          className="font-jp font-bold text-foreground leading-none"
          style={{ fontSize: "36px" }}
        >
          {k.char}
        </span>
        <div className="flex flex-col items-end gap-1">
          <span
            className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `var(--level-${jlpt.toLowerCase()})` }}
          >
            {jlpt}
          </span>
          <span className="text-[10px] text-muted-foreground">{FREQ_LABEL[freq]}</span>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground font-jp leading-snug">{k.reading}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{k.meaning}</p>

      {k.example_words && k.example_words.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">
            Kanji ini juga muncul dalam:
          </p>
          <ul className="space-y-1.5">
            {k.example_words.slice(0, 2).map((w, i) => (
              <li key={i} className="text-xs">
                <span className="font-jp font-medium text-foreground">{w.word}</span>
                <span className="font-jp text-muted-foreground ml-1.5">({w.reading})</span>
                <span className="text-muted-foreground"> — {w.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(!k.example_words || k.example_words.length === 0) && k.examples && (
        <p className="mt-3 text-[11px] text-muted-foreground font-jp">{k.examples}</p>
      )}
    </div>
  );
}

// ============= Level / Style card =============
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
  const meta = styleMeta(level);
  const tone = meta.tone;
  const [grammarOpen, setGrammarOpen] = useState(false);
  const japanese = cleanJapanese(data.japanese);

  return (
    <div
      className="rounded-2xl border bg-card shadow-sm overflow-hidden"
      style={{ borderColor: `var(--${tone})` + "40" }}
    >
      {/* DEFAULT (always visible) */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <StylePill level={level} />
          <JlptRef level={level} />
        </div>

        <div className="flex items-start gap-2">
          <p className="font-jp text-2xl sm:text-3xl leading-snug text-foreground flex-1 break-words">
            {japanese}
          </p>
          <SpeakerButton text={japanese} />
        </div>

        <div className="mt-4">
          <NaturalnessBar value={data.naturalness} />
        </div>

        {data.when_to_use && (
          <p className="mt-3 text-sm text-foreground/80 line-clamp-1">
            <span className="text-xs font-semibold text-foreground/60">Kapan dipakai: </span>
            {data.when_to_use}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggle}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition"
          >
            <ChevronDown
              className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")}
            />
            {open ? "Sembunyikan" : "Lihat detail"}
          </button>
          {onFavorite && (
            <button
              onClick={onFavorite}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition",
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
      </div>

      {/* EXPANDED */}
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-border/60">
          <p className="mt-4 italic text-sm text-muted-foreground">{data.romaji}</p>

          {data.naturalness_note && (
            <p className="text-xs text-muted-foreground">{data.naturalness_note}</p>
          )}

          {data.suitable_for && (
            <InfoRow label="Cocok diucapkan kepada" value={data.suitable_for} />
          )}
          {data.impression && (
            <InfoRow label="Kesan yang diterima lawan bicara" value={data.impression} />
          )}
          {data.why_this_level && (
            <InfoRow label="Kenapa level ini?" value={data.why_this_level} />
          )}

          {data.grammar?.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setGrammarOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold hover:bg-muted/40 transition"
                aria-expanded={grammarOpen}
              >
                <span>Tata Bahasa</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    grammarOpen && "rotate-180",
                  )}
                />
              </button>
              {grammarOpen && (
                <ul className="px-3 pb-3 space-y-2">
                  {data.grammar.map((g, i) => (
                    <li key={i} className="rounded-lg border border-border p-3 text-sm">
                      <p className="font-jp font-medium text-foreground">{g.pattern}</p>
                      <p className="mt-1 text-muted-foreground">{g.explanation}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {data.kanji?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Kanji</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.kanji.map((k, i) => (
                  <KanjiCard key={i} k={k} />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onToggle}
            className="w-full text-xs font-medium text-muted-foreground hover:text-foreground py-2 transition"
          >
            ▴ Sembunyikan
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-sm">
      <p className="text-xs font-semibold text-foreground mb-0.5">{label}</p>
      <p className="text-foreground/80">{value}</p>
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
  const tone = "level-n3";
  const japanese = cleanJapanese(data.japanese);
  const [whyOpen, setWhyOpen] = useState(false);
  return (
    <div
      className="rounded-2xl border-2 p-6 sm:p-8 shadow-md natural-pulse-border"
      style={{
        borderColor: `var(--${tone})`,
        background: `linear-gradient(135deg, color-mix(in oklab, var(--${tone}) 14%, transparent), color-mix(in oklab, var(--${tone}) 4%, transparent))`,
      }}
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Star className="w-4 h-4" style={{ color: `var(--${tone})` }} fill="currentColor" />
        <h2
          className="text-sm font-bold uppercase tracking-wide"
          style={{ color: `var(--${tone})` }}
        >
          Yang paling natural
        </h2>
      </div>
      <div className="flex items-start gap-3">
        <p className="font-jp text-3xl sm:text-4xl leading-snug text-foreground flex-1 break-words">
          {japanese}
        </p>
        <SpeakerButton text={japanese} />
      </div>
      <p className="mt-2 italic text-sm text-muted-foreground">{data.romaji}</p>

      <p
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{
          backgroundColor: `color-mix(in oklab, var(--${tone}) 16%, transparent)`,
          color: `var(--${tone})`,
        }}
      >
        ✓ Inilah yang akan terdengar alami bagi penutur asli
      </p>

      <div className="mt-4">
        <NaturalnessBar value="native" />
      </div>
      <p className="mt-4 text-sm text-foreground/80">{data.reason}</p>

      {data.native_note && (
        <div className="mt-3 rounded-lg border border-border/60 bg-background/60 overflow-hidden">
          <button
            onClick={() => setWhyOpen((v) => !v)}
            aria-expanded={whyOpen}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold hover:bg-muted/40 transition"
          >
            <span>Mengapa ini yang paling natural?</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                whyOpen && "rotate-180",
              )}
            />
          </button>
          {whyOpen && (
            <p className="px-3 pb-3 text-sm text-foreground/80 italic">{data.native_note}</p>
          )}
        </div>
      )}

      {onFavorite && (
        <div className="mt-4">
          <button
            onClick={onFavorite}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition shadow-sm",
              isFav
                ? "bg-amber-100 border-amber-300 text-amber-800"
                : "bg-background border-border text-foreground hover:bg-muted",
            )}
          >
            <Star className="w-4 h-4" fill={isFav ? "currentColor" : "none"} />
            {isFav ? "Tersimpan di Favorit" : "⭐ Simpan ke Favorit"}
          </button>
        </div>
      )}
    </div>
  );
}


// ============= Alternatives =============
const RANK_CIRCLE = ["①", "②", "③", "④", "⑤"];

function naturalnessFromRank(rank: number | undefined): Naturalness {
  if (rank === 1) return "native";
  if (rank === 2) return "stiff";
  return "textbook";
}

export function AlternativesSection({ items }: { items: AlternativeExpression[] }) {
  // Sort by rank so ① always shows first
  const sorted = [...items].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground/80">
        Alternatif berdasarkan situasi
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {sorted.map((alt, i) => {
          const meta = styleMeta(alt.level);
          const rank = alt.rank ?? i + 1;
          const japanese = cleanJapanese(alt.japanese);
          return (
            <div
              key={i}
              className="rounded-2xl border bg-card p-4 shadow-sm flex flex-col"
              style={{ borderColor: `var(--${meta.tone})` + "40" }}
            >
              <div className="flex items-start gap-2 mb-2">
                <span
                  className="text-lg leading-none font-bold"
                  style={{ color: `var(--${meta.tone})` }}
                  aria-label={`Peringkat ${rank}`}
                >
                  {RANK_CIRCLE[rank - 1] ?? `(${rank})`}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground leading-tight">
                    {alt.role_label ?? "Pilihan"}
                  </p>
                  {alt.context_label && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {alt.context_label}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <p className="font-jp text-xl leading-snug text-foreground flex-1 break-words">
                  {japanese}
                </p>
                <SpeakerButton text={japanese} size="sm" />
              </div>
              <p className="mt-1 italic text-xs text-muted-foreground">{alt.romaji}</p>

              <div className="mt-3">
                <NaturalnessBar value={naturalnessFromRank(rank)} compact />
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <StylePill level={alt.level} size="sm" />
                <JlptRef level={alt.level} />
              </div>
              <p className="mt-2 text-xs text-foreground/80">{alt.explanation}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
