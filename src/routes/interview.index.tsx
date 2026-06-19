import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ChevronRight, ChevronDown, Clock, Trophy, Sparkles } from "lucide-react";
import {
  INTERVIEW_SCENARIOS,
  SCENARIO_CATEGORIES,
  getRecommendedScenarios,
  type InterviewScenario,
  type ScenarioCategory,
} from "@/lib/interview-scenarios";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { UsageMeter } from "@/components/UsageMeter";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getCurriculumOverview } from "@/lib/curriculum.functions";

type SessionRow = {
  id: string;
  scenario_id: string;
  scenario_title: string;
  grammar_score: number | null;
  naturalness_score: number | null;
  confidence_score: number | null;
  vocabulary_level: string | null;
  created_at: string;
};

export const Route = createFileRoute("/interview/")({
  head: () => ({
    meta: [
      { title: "Interview Simulator — Wawancara Kerja Jepang | NihongoLevel" },
      {
        name: "description",
        content:
          "Latihan interview bahasa Jepang dengan AI: Tokutei Ginou, staff restoran, dan lainnya. Dapat skor grammar, naturalness, confidence + saran perbaikan.",
      },
      { property: "og:title", content: "AI Interview Simulator — NihongoLevel" },
      {
        property: "og:description",
        content:
          "Siapkan interview kerja di Jepang dengan AI. Skenario realistis + evaluasi instan.",
      },
    ],
    links: [{ rel: "canonical", href: "/interview" }],
  }),
  component: InterviewIndex,
});

function InterviewIndex() {
  const { lang } = useT();
  const { user } = useAuth();
  const isId = lang === "id";
  const [history, setHistory] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCat, setActiveCat] = useState<ScenarioCategory | "all">("all");
  const [showAll, setShowAll] = useState(false);

  const fetchOverview = useServerFn(getCurriculumOverview);
  const overviewQ = useQuery({
    queryKey: ["curriculum-overview", user?.id],
    queryFn: () => fetchOverview(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const currentLevelOrder = useMemo(() => {
    const lv = overviewQ.data?.levels.find((l) => l.status === "current");
    return lv?.order_index ?? null;
  }, [overviewQ.data]);

  const recommended = useMemo(
    () => getRecommendedScenarios(currentLevelOrder),
    [currentLevelOrder],
  );
  const recommendedIds = new Set(recommended.map((s) => s.id));

  const visible = useMemo(() => {
    const base = INTERVIEW_SCENARIOS.filter((s) => !recommendedIds.has(s.id));
    return activeCat === "all" ? base : base.filter((s) => s.category === activeCat);
  }, [activeCat, recommendedIds]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("interview_sessions")
      .select(
        "id,scenario_id,scenario_title,grammar_score,naturalness_score,confidence_score,vocabulary_level,created_at",
      )
      .eq("user_id", user.id)
      .eq("completed", true)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setHistory((data as SessionRow[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-violet-900">
          AI Interview Simulator
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isId
            ? "Latihan interview kerja Jepang dengan AI. Dapat skor & saran setelah selesai."
            : "Practice Japanese job interviews with AI. Get scores and feedback after each session."}
        </p>
      </header>

      {!user && (
        <div className="mb-8 rounded-2xl bg-violet-100 border border-violet-200 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-sm text-violet-900">
              {isId
                ? "💡 Coba demo Kaigo gratis tanpa login — 3 pertanyaan pertama bisa dijawab langsung."
                : "💡 Try the Kaigo demo for free — answer your first 3 questions without signing in."}
            </p>
          </div>
          <Link
            to="/interview/$scenarioId"
            params={{ scenarioId: "iv_kaigo" }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-lime-500 hover:bg-lime-400 px-4 py-2.5 text-sm font-bold text-violet-900 transition flex-shrink-0"
          >
            {isId ? "Coba demo gratis" : "Try free demo"} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {user && <UsageMeter feature="interview" className="mb-6" />}

      {/* Recommended */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-violet-900">
            {isId ? "Direkomendasikan untukmu" : "Recommended for you"}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {recommended.map((s) => (
            <ScenarioCard key={s.id} s={s} isId={isId} highlighted />
          ))}
        </div>
      </section>

      {/* All scenarios — collapsible */}
      <section className="mb-12">
        <button
          onClick={() => setShowAll((v) => !v)}
          className="w-full flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-white hover:bg-violet-50 px-5 py-4 transition mb-5"
        >
          <div className="text-left">
            <p className="font-bold text-violet-900">
              {isId ? "Lihat semua 20 bidang" : "See all 20 scenarios"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isId
                ? "Tokutei Ginou, manufaktur, infrastruktur, profesional & lainnya"
                : "Tokutei Ginou, manufacturing, infrastructure, professional & more"}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-violet-700 transition-transform flex-shrink-0",
              showAll && "rotate-180",
            )}
          />
        </button>

        {showAll && (
          <>
            {/* Category tabs */}
            <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-3 border-b border-foreground/10">
              <div className="flex min-w-max items-center gap-2">
                {(
                  [
                    { id: "all" as const, label_id: "Semua", label_en: "All", emoji: "✦" },
                    ...SCENARIO_CATEGORIES,
                  ]
                ).map((c) => {
                  const active = activeCat === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCat(c.id as typeof activeCat)}
                      className={cn(
                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] font-bold transition border",
                        active
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-white text-foreground/70 border-foreground/15 hover:border-foreground/40",
                      )}
                    >
                      <span className="text-sm">{c.emoji}</span>
                      {isId ? c.label_id : c.label_en}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              key={activeCat}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-1 duration-300"
            >
              {visible.map((s, i) => (
                <ScenarioCard key={s.id} s={s} isId={isId} altBg={i % 2 === 1} />
              ))}
            </div>
          </>
        )}
      </section>

      {user && (
        <section>
          <h2 className="text-lg font-bold mb-4 inline-flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {isId ? "Riwayat Sesi" : "Session History"}
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isId ? "Memuat..." : "Loading..."}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center">
              <div className="text-3xl mb-2">🎤</div>
              <p className="text-sm font-semibold">
                {isId ? "Belum ada sesi yang selesai" : "No completed sessions yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isId
                  ? "Pilih skenario di atas. Jawab minimal 2 pertanyaan, lalu tekan 'Akhiri sesi & lihat evaluasi'."
                  : "Pick a scenario above. Answer at least 2 questions, then tap 'End session & view evaluation'."}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {history.map((h) => {
                const avg =
                  ((h.grammar_score ?? 0) +
                    (h.naturalness_score ?? 0) +
                    (h.confidence_score ?? 0)) /
                  3;
                return (
                  <li
                    key={h.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-white p-4"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{h.scenario_title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleString(isId ? "id-ID" : "en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {h.vocabulary_level && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">
                            {h.vocabulary_level}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-right shrink-0">
                      <Trophy className="w-4 h-4 text-violet-600" />
                      <span className="text-xl font-bold tabular-nums">{Math.round(avg)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function ScenarioCard({
  s,
  isId,
  highlighted,
  altBg,
}: {
  s: InterviewScenario;
  isId: boolean;
  highlighted?: boolean;
  altBg?: boolean;
}) {
  const bg = highlighted
    ? "bg-gradient-to-br from-violet-600 to-violet-700 text-white border-violet-700"
    : altBg
      ? "bg-lime-100 border-foreground/10"
      : "bg-violet-100 border-foreground/10";
  const textPrimary = highlighted ? "text-white" : "text-violet-900";
  const textSecondary = highlighted ? "text-violet-100/80" : "text-foreground/70";

  return (
    <Link
      to="/interview/$scenarioId"
      params={{ scenarioId: s.id }}
      className={cn(
        "group relative flex flex-col rounded-2xl p-6 border transition hover:-translate-y-0.5",
        bg,
      )}
    >
      <span
        className={cn(
          "absolute top-4 right-4 text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-1 rounded-md",
          highlighted ? "bg-lime-500 text-violet-900" : "bg-foreground text-background",
        )}
      >
        {s.level}
      </span>
      {highlighted && s.id === "iv_kaigo" && (
        <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider bg-lime-500 text-violet-900 px-2 py-0.5 rounded-full">
          {isId ? "Demo gratis" : "Free demo"}
        </span>
      )}
      <div className="text-3xl mb-4 mt-4">{s.emoji}</div>
      <h3 className={cn("font-black text-lg leading-tight tracking-tight", textPrimary)}>
        {isId ? s.title_id : s.title_en}
      </h3>
      <p className={cn("mt-2 text-sm line-clamp-3 leading-relaxed flex-1", textSecondary)}>
        {isId ? s.description_id : s.description_en}
      </p>
      <div
        className={cn(
          "mt-5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.22em]",
          highlighted ? "text-lime-300" : "text-violet-900",
        )}
      >
        {isId ? "Mulai" : "Start"}
        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
