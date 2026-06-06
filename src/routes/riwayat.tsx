import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Trash2, ChevronDown, Star } from "lucide-react";
import {
  getHistory,
  useLocalCollection,
  deleteHistory,
  formatIndonesianDate,
  addFavoriteFromMostNatural,
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
} from "@/components/result-parts";
import { cn } from "@/lib/utils";
import {
  addFavoriteFromLevel,
} from "@/lib/storage";

export const Route = createFileRoute("/riwayat")({
  head: () => ({ meta: [{ title: "Riwayat — NihongoLevel" }] }),
  component: RiwayatPage,
});

const LEVELS: { key: LevelKey; label: string }[] = [
  { key: "n4", label: "N4" },
  { key: "n3", label: "N3" },
  { key: "n2", label: "N2" },
  { key: "n1", label: "N1" },
];

function RiwayatPage() {
  const [history] = useLocalCollection<HistoryEntry>(getHistory);
  const [query, setQuery] = useState("");

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
      <h1 className="text-2xl font-bold mb-4">Riwayat</h1>
      <div className="relative mb-5">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari kalimat, ekspresi Jepang, atau situasi..."
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat"
          desc="Mulai dengan menerjemahkan kalimat pertamamu."
        />
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
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const tone = `level-${(entry.most_natural.level || "N3").toLowerCase()}`;
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
            if (confirm("Hapus entri ini?")) deleteHistory(entry.id);
          }}
          aria-label="Hapus"
          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3">
        <p className="font-jp text-2xl leading-snug text-foreground">
          {entry.most_natural.japanese}
        </p>
        <p className="mt-0.5 italic text-sm text-muted-foreground">{entry.most_natural.romaji}</p>
        <span
          className="mt-2 inline-flex items-center justify-center min-w-10 h-6 px-2 rounded-full text-[11px] font-bold text-white"
          style={{ backgroundColor: `var(--${tone})` }}
        >
          {entry.most_natural.level}
        </span>
      </div>

      <div className="mt-3 flex gap-2 flex-wrap">
        {LEVELS.map(({ label }) => (
          <span
            key={label}
            className="inline-flex items-center justify-center min-w-9 h-5 px-1.5 rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: `var(--level-${label.toLowerCase()})` }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition"
        >
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
          {open ? "Sembunyikan" : "Lihat detail"}
        </button>
        <button
          onClick={() => {
            addFavoriteFromMostNatural(entry);
            setTick((t) => t + 1);
          }}
          disabled={isFavorited(entry.id, "most_natural")}
          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition disabled:opacity-50"
        >
          <Star className="w-3.5 h-3.5" />
          {isFavorited(entry.id, "most_natural") ? "Tersimpan" : "Simpan favorit"}
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
                onChange={() => setTick((t) => t + 1)}
              />
            ))}
          </div>
          <MostNaturalCard
            data={entry.most_natural}
            isFav={isFavorited(entry.id, "most_natural")}
            onFavorite={() => {
              addFavoriteFromMostNatural(entry);
              setTick((t) => t + 1);
            }}
          />
          {entry.alternatives?.length > 0 && <AlternativesSection items={entry.alternatives} />}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
