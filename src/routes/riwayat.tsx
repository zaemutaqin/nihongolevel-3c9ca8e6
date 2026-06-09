import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Trash2, ChevronDown, Star } from "lucide-react";
import {
  getHistory,
  useLocalCollection,
  deleteHistory,
  formatIndonesianDate,
  addFavoriteFromMostNatural,
  addFavoriteFromLevel,
  isFavorited,
  type HistoryEntry,
  type LevelKey,
} from "@/lib/storage";
import {
  IntentChip,
  IntentBadge,
  SocialAnalysisCard,
  LevelCard,
  MostNaturalCard,
  AlternativesSection,
  StylePill,
  JlptRef,
  cleanJapanese,
} from "@/components/result-parts";
import { SpeakerButton } from "@/components/SpeakerButton";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { LockedFeature } from "@/components/LockedFeature";

export const Route = createFileRoute("/riwayat")({
  head: () => ({
    meta: [
      { title: "Riwayat — NihongoLevel" },
      {
        name: "description",
        content:
          "Semua pencarian ekspresi bahasa Jepang kamu tersimpan di sini — tinjau ulang, tandai favorit, dan lanjutkan belajar dari mana pun kamu berhenti.",
      },
      { property: "og:title", content: "Riwayat Pencarian — NihongoLevel" },
      { property: "og:description", content: "Riwayat lengkap pencarian ekspresi bahasa Jepang kamu." },
      { property: "og:url", content: "/riwayat" },
    ],
    links: [{ rel: "canonical", href: "/riwayat" }],
  }),

  component: RiwayatPage,
});

const LEVELS: { key: LevelKey; label: string }[] = [
  { key: "n4", label: "N4" },
  { key: "n3", label: "N3" },
  { key: "n2", label: "N2" },
  { key: "n1", label: "N1" },
];

function RiwayatPage() {
  const { t } = useT();
  const { user } = useAuth();
  const [history] = useLocalCollection<HistoryEntry>(getHistory);
  const [query, setQuery] = useState("");

  if (!user) return <LockedFeature />;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return history;
    return history.filter((h) => {
      const blob = [
        h.input,
        h.intent.type,
        h.intent.explanation,
        h.most_natural.japanese,
        h.most_natural.romaji,
        ...Object.values(h.levels).map((l) => l.japanese),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [history, query]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{t("hist.title")}</h1>
      <div className="relative mb-5">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("hist.searchPlaceholder")}
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="font-semibold text-foreground">{t("hist.empty.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("hist.empty.desc")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((h) => (
            <HistoryCard key={h.id} entry={h} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{formatIndonesianDate(entry.date)}</p>
          <p className="mt-1 font-semibold text-foreground">{entry.input}</p>
          <div className="mt-2">
            <IntentChip intent={entry.intent} />
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm(t("hist.confirmDelete"))) deleteHistory(entry.id);
          }}
          aria-label={t("misc.deleteAria")}
          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3">
        <div className="flex items-start gap-2">
          <p className="font-jp text-2xl leading-snug text-foreground flex-1 break-words">
            {cleanJapanese(entry.most_natural.japanese)}
          </p>
          <SpeakerButton text={cleanJapanese(entry.most_natural.japanese)} size="sm" />
        </div>

        <p className="mt-0.5 italic text-sm text-muted-foreground">{entry.most_natural.romaji}</p>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <StylePill level={entry.most_natural.level} size="sm" />
          <JlptRef level={entry.most_natural.level} />
        </div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition"
        >
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
          {open ? t("rp.hide") : t("rp.viewDetails")}
        </button>
        <button
          onClick={() => {
            addFavoriteFromMostNatural(entry);
            setTick((c) => c + 1);
          }}
          disabled={isFavorited(entry.id, "most_natural")}
          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition disabled:opacity-50"
        >
          <Star className="w-3.5 h-3.5" />
          {isFavorited(entry.id, "most_natural") ? t("rp.saved") : t("rp.saveFav")}
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-5" key={tick}>
          <IntentBadge intent={entry.intent} />
          <SocialAnalysisCard data={entry.social_analysis} />
          <div className="space-y-3">
            {LEVELS.map(({ key, label }) => (
              <ExpandableLevel
                key={key}
                level={label}
                entry={entry}
                levelKey={key}
                onChange={() => setTick((c) => c + 1)}
              />
            ))}
          </div>
          <MostNaturalCard
            data={entry.most_natural}
            isFav={isFavorited(entry.id, "most_natural")}
            onFavorite={() => {
              addFavoriteFromMostNatural(entry);
              setTick((c) => c + 1);
            }}
          />
          {entry.alternatives?.length > 0 && <AlternativesSection items={entry.alternatives} />}
        </div>
      )}
    </div>
  );
}

function ExpandableLevel({
  level,
  entry,
  levelKey,
  onChange,
}: {
  level: string;
  entry: HistoryEntry;
  levelKey: LevelKey;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <LevelCard
      level={level}
      data={entry.levels[levelKey]}
      open={open}
      onToggle={() => setOpen((v) => !v)}
      isFav={isFavorited(entry.id, "level", level)}
      onFavorite={() => {
        addFavoriteFromLevel(entry, levelKey);
        onChange();
      }}
    />
  );
}
