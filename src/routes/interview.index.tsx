import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ChevronRight, Clock, Trophy } from "lucide-react";
import {
  INTERVIEW_SCENARIOS,
  SCENARIO_CATEGORIES,
  type ScenarioCategory,
} from "@/lib/interview-scenarios";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { SignInButton } from "@/components/SignInButton";
import { UsageMeter } from "@/components/UsageMeter";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";


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
      { title: "AI Interview Simulator — Latih Wawancara Kerja Jepang | NihongoLevel" },
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

  const visible = useMemo(
    () =>
      activeCat === "all"
        ? INTERVIEW_SCENARIOS
        : INTERVIEW_SCENARIOS.filter((s) => s.category === activeCat),
    [activeCat],
  );

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    supabase
      .from("interview_sessions")
      .select("id,scenario_id,scenario_title,grammar_score,naturalness_score,confidence_score,vocabulary_level,created_at")
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {isId ? "AI Interview Simulator" : "AI Interview Simulator"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isId
            ? "Latihan interview kerja Jepang dengan AI. Dapat skor & saran setelah selesai."
            : "Practice Japanese job interviews with AI. Get scores and feedback after each session."}
        </p>
      </header>

      {!user && (
        <div className="mb-8 rounded-xl border border-border bg-card p-6 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            {isId ? "Masuk dulu untuk mulai latihan interview." : "Sign in to start practicing."}
          </p>
          <SignInButton />
        </div>
      )}

      {user && <UsageMeter feature="interview" className="mb-6" />}

      <section className="mb-12">
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl sm:text-3xl">
            {isId ? "Pilih Skenario" : "Choose a Scenario"}
          </h2>
          <span className="text-[11px] uppercase tracking-[0.22em] font-semibold text-muted-foreground">
            {visible.length} {isId ? "bidang" : "scenarios"}
          </span>
        </div>

        {/* Category tabs */}
        <div className="-mx-4 mb-6 overflow-x-auto px-4">
          <div className="flex min-w-max items-center gap-2 border-b border-border pb-px">
            {([
              { id: "all" as const, label_id: "Semua", label_en: "All", emoji: "✦" },
              ...SCENARIO_CATEGORIES,
            ]).map((c) => {
              const active = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id as typeof activeCat)}
                  className={cn(
                    "relative -mb-px inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="text-sm">{c.emoji}</span>
                  {isId ? c.label_id : c.label_en}
                  {active && (
                    <span className="absolute inset-x-1 -bottom-px h-[3px] bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div
          key={activeCat}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          {visible.map((s) => (
            <Link
              key={s.id}
              to="/interview/$scenarioId"
              params={{ scenarioId: s.id }}
              className="group relative flex flex-col bg-card border border-border p-4 hover:border-primary hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-2xl">{s.emoji}</div>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] bg-foreground text-background px-1.5 py-0.5">
                  {s.level}
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg leading-snug">
                {isId ? s.title_id : s.title_en}
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                {isId ? s.description_id : s.description_en}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                {isId ? "Mulai" : "Start"}
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

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
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
              <div className="text-3xl mb-2">🎤</div>
              <p className="text-sm font-semibold">
                {isId ? "Belum ada sesi yang selesai" : "No completed sessions yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isId
                  ? "Pilih skenario di atas. Jawab minimal 2 pertanyaan, lalu tekan 'Selesai & Evaluasi' untuk dapat skor."
                  : "Pick a scenario above. Answer at least 2 questions, then tap 'Finish & Evaluate' to get scored."}
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
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
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
                      <Trophy className="w-4 h-4 text-primary" />
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
