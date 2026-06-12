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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
        <div className="mb-10 -mx-4 sm:mx-0 rounded-2xl bg-[#E8D5F2] px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="max-w-xl">
            <p className="inline-block text-[10px] font-bold uppercase tracking-[0.28em] bg-[#D9F26B] text-foreground px-2.5 py-1 rounded-full">
              {isId ? "Akses Diperlukan" : "Access Required"}
            </p>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl text-foreground leading-tight">
              {isId
                ? "Masuk untuk mulai latihan interview."
                : "Sign in to start practicing interviews."}
            </h2>
          </div>
          <div className="shrink-0">
            <SignInButton />
          </div>
        </div>
      )}

      {user && <UsageMeter feature="interview" className="mb-6" />}

      <section className="mb-12">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            {isId ? "Pilih Skenario" : "Choose a Scenario"}
          </h2>
          <span className="text-xs font-medium text-muted-foreground">
            {visible.length} {isId ? "Bidang" : "scenarios"}
          </span>
        </div>

        {/* Category tabs — pills */}
        <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-3 border-b border-foreground/10">
          <div className="flex min-w-max items-center gap-2">
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
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] font-bold transition border",
                    active
                      ? "bg-primary text-white border-primary"
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
            <Link
              key={s.id}
              to="/interview/$scenarioId"
              params={{ scenarioId: s.id }}
              className="group relative flex flex-col rounded-2xl p-6 border border-foreground/10 hover:-translate-y-0.5 hover:border-foreground/25 transition"
              style={{ background: i % 2 === 0 ? "#E8D5F2" : "#D9F26B" }}
            >
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-[0.18em] bg-foreground text-background px-2 py-1 rounded-md">
                {s.level}
              </span>
              <div className="text-3xl mb-4">{s.emoji}</div>
              <h3 className="font-black text-lg leading-tight tracking-tight text-foreground">
                {isId ? s.title_id : s.title_en}
              </h3>
              <p className="mt-2 text-sm text-foreground/70 line-clamp-3 leading-relaxed flex-1">
                {isId ? s.description_id : s.description_en}
              </p>
              <div className="mt-5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.22em] text-foreground">
                {isId ? "Mulai" : "Start"}
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
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
            <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center">
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
