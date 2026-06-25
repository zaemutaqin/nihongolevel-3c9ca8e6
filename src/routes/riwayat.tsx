import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Trash2, ChevronDown, Star, Repeat2, MessageSquare } from "lucide-react";
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
import {
  getMyInterviewSessions,
  type InterviewSessionSummary,
} from "@/lib/interview-history.functions";

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

type FilterKey = "translator" | "interview" | "kasual" | "polite" | "workplace" | "keigo";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "translator", label: "Translator" },
  { key: "interview", label: "Interview" },
  { key: "kasual", label: "Kasual" },
  { key: "polite", label: "Polite" },
  { key: "workplace", label: "Workplace" },
  { key: "keigo", label: "Keigo" },
];

// Map most_natural.level (N4..N1) to filter style chip
const LEVEL_TO_FILTER: Record<string, FilterKey> = {
  N4: "kasual",
  N3: "polite",
  N2: "workplace",
  N1: "keigo",
};

type TimelineItem =
  | { kind: "translator"; date: string; sortKey: number; entry: HistoryEntry }
  | { kind: "interview"; date: string; sortKey: number; entry: InterviewSessionSummary };

type DateBucket = "today" | "yesterday" | "week" | "older";

function bucketOf(iso: string): DateBucket {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const today = startOfDay(now);
  const dayMs = 86_400_000;
  const t = startOfDay(d);
  if (t === today) return "today";
  if (t === today - dayMs) return "yesterday";
  if (t >= today - 6 * dayMs) return "week";
  return "older";
}

const BUCKET_LABEL: Record<DateBucket, string> = {
  today: "Hari ini",
  yesterday: "Kemarin",
  week: "Minggu ini",
  older: "Lebih lama",
};

const BUCKET_ORDER: DateBucket[] = ["today", "yesterday", "week", "older"];

function RiwayatPage() {
  const { t } = useT();
  const { profile, user } = useAuth();
  const [history] = useLocalCollection<HistoryEntry>(getHistory);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Set<FilterKey>>(new Set());

  const fetchInterviews = useServerFn(getMyInterviewSessions);
  const interviewsQ = useQuery({
    queryKey: ["interview-history", user?.id ?? "anon"],
    queryFn: () => fetchInterviews(),
    enabled: !!user && !!profile?.is_pro,
    staleTime: 60_000,
  });

  if (!profile?.is_pro) return <LockedFeature />;

  const toggle = (k: FilterKey) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const items: TimelineItem[] = useMemo(() => {
    const list: TimelineItem[] = [];
    for (const h of history) {
      list.push({ kind: "translator", date: h.date, sortKey: h.id, entry: h });
    }
    for (const s of interviewsQ.data ?? []) {
      list.push({
        kind: "interview",
        date: s.created_at,
        sortKey: new Date(s.created_at).getTime(),
        entry: s,
      });
    }
    return list.sort((a, b) => b.sortKey - a.sortKey);
  }, [history, interviewsQ.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const wantsKind = new Set<FilterKey>();
    const wantsStyle = new Set<FilterKey>();
    for (const k of active) {
      if (k === "translator" || k === "interview") wantsKind.add(k);
      else wantsStyle.add(k);
    }
    return items.filter((it) => {
      if (wantsKind.size > 0) {
        if (it.kind === "translator" && !wantsKind.has("translator")) return false;
        if (it.kind === "interview" && !wantsKind.has("interview")) return false;
      }
      if (wantsStyle.size > 0) {
        if (it.kind !== "translator") return false;
        const style = LEVEL_TO_FILTER[(it.entry.most_natural.level || "").toUpperCase()];
        if (!style || !wantsStyle.has(style)) return false;
      }
      if (!q) return true;
      if (it.kind === "translator") {
        const h = it.entry;
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
      } else {
        const s = it.entry;
        return [s.scenario_title, s.summary ?? "", s.scenario_id].join(" ").toLowerCase().includes(q);
      }
    });
  }, [items, query, active]);

  const grouped = useMemo(() => {
    const map: Record<DateBucket, TimelineItem[]> = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };
    for (const it of filtered) map[bucketOf(it.date)].push(it);
    return map;
  }, [filtered]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4 text-violet-950">{t("hist.title")}</h1>

      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("hist.searchPlaceholder")}
          className="w-full rounded-xl border border-violet-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300/50"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip
          label="Semua"
          active={active.size === 0}
          onClick={() => setActive(new Set())}
        />
        {FILTERS.map((f) => (
          <FilterChip
            key={f.key}
            label={f.label}
            active={active.has(f.key)}
            onClick={() => toggle(f.key)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-10 text-center">
          <p className="font-semibold text-violet-950">{t("hist.empty.title")}</p>
          <p className="mt-1 text-sm text-violet-700/70">{t("hist.empty.desc")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {BUCKET_ORDER.map((b) =>
            grouped[b].length === 0 ? null : (
              <section key={b}>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-700/70">
                  {BUCKET_LABEL[b]}
                  <span className="ml-2 text-violet-500/60">({grouped[b].length})</span>
                </h2>
                <div className="space-y-4">
                  {grouped[b].map((it, i) =>
                    it.kind === "translator" ? (
                      <HistoryCard key={`t-${it.entry.id}`} entry={it.entry} index={i} />
                    ) : (
                      <InterviewCard key={`i-${it.entry.id}`} entry={it.entry} />
                    ),
                  )}
                </div>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-violet-700 bg-violet-700 text-white shadow-sm"
          : "border-violet-200 bg-white text-violet-800 hover:border-violet-400 hover:bg-violet-50",
      )}
    >
      {label}
    </button>
  );
}

function PraktiseLagiButton({ text }: { text: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        try {
          sessionStorage.setItem("nihongo_prefill", text);
        } catch {}
        navigate({ to: "/translate" });
      }}
      className="inline-flex items-center gap-1 rounded-lg bg-lime-400 px-2.5 py-1 text-[11px] font-bold text-violet-950 hover:bg-lime-300 transition"
      title="Latih lagi di Translator"
    >
      <Repeat2 className="w-3.5 h-3.5" />
      Latih lagi
    </button>
  );
}

function InterviewCard({ entry }: { entry: InterviewSessionSummary }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-violet-600/70">{formatIndonesianDate(entry.created_at)}</p>
          <div className="mt-1 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-600" />
            <p className="font-semibold text-violet-950 truncate">{entry.scenario_title}</p>
          </div>
          <span className="mt-2 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-violet-800">
            Interview
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/interview/$scenarioId", params: { scenarioId: entry.scenario_id } })}
          className="inline-flex items-center gap-1 rounded-lg bg-lime-400 px-2.5 py-1 text-[11px] font-bold text-violet-950 hover:bg-lime-300 transition"
        >
          <Repeat2 className="w-3.5 h-3.5" />
          Latih lagi
        </button>
      </div>
      {entry.summary && (
        <p className="mt-3 text-sm text-violet-900/80 leading-relaxed line-clamp-3">{entry.summary}</p>
      )}
      {(entry.grammar_score || entry.naturalness_score || entry.confidence_score) && (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {entry.grammar_score != null && (
            <span className="rounded-md bg-violet-50 px-2 py-0.5 text-violet-800">
              Grammar {entry.grammar_score}
            </span>
          )}
          {entry.naturalness_score != null && (
            <span className="rounded-md bg-violet-50 px-2 py-0.5 text-violet-800">
              Natural {entry.naturalness_score}
            </span>
          )}
          {entry.confidence_score != null && (
            <span className="rounded-md bg-violet-50 px-2 py-0.5 text-violet-800">
              Confidence {entry.confidence_score}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryCard({ entry, index = 0 }: { entry: HistoryEntry; index?: number }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const bg = index % 2 === 0 ? "#E8D5F2" : "#D9F26B";

  return (
    <div className="rounded-2xl border border-violet-300/40 p-5" style={{ background: bg }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-violet-900/60">{formatIndonesianDate(entry.date)}</p>
          <p className="mt-1 font-semibold text-violet-950">{entry.input}</p>
          <div className="mt-2">
            <IntentChip intent={entry.intent} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <PraktiseLagiButton text={entry.input} />
          <button
            onClick={() => {
              if (confirm(t("hist.confirmDelete"))) deleteHistory(entry.id);
            }}
            aria-label={t("misc.deleteAria")}
            className="p-1.5 rounded text-violet-900/60 hover:text-destructive hover:bg-white/40 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-start gap-2">
          <p className="font-jp text-2xl leading-snug text-violet-950 flex-1 break-words">
            {cleanJapanese(entry.most_natural.japanese)}
          </p>
          <SpeakerButton text={cleanJapanese(entry.most_natural.japanese)} size="sm" />
        </div>

        <p className="mt-0.5 italic text-sm text-violet-900/70">{entry.most_natural.romaji}</p>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <StylePill level={entry.most_natural.level} size="sm" />
          <JlptRef level={entry.most_natural.level} />
        </div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-violet-900/20 bg-white/40 hover:bg-white/70 transition"
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
          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-violet-900/20 bg-white/40 hover:bg-white/70 transition disabled:opacity-50"
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
