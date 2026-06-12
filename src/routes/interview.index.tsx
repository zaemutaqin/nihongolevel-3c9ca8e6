import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ChevronRight, Clock, Trophy } from "lucide-react";
import { INTERVIEW_SCENARIOS } from "@/lib/interview-scenarios";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { SignInButton } from "@/components/SignInButton";
import { supabase } from "@/integrations/supabase/client";

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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
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

      <section className="mb-12">
        <h2 className="text-lg font-bold mb-4">{isId ? "Pilih Skenario" : "Choose a Scenario"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {INTERVIEW_SCENARIOS.map((s) => (
            <Link
              key={s.id}
              to="/interview/$scenarioId"
              params={{ scenarioId: s.id }}
              className="group rounded-xl border-2 border-border bg-card p-5 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-3xl">{s.emoji}</div>
                <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-muted px-2 py-0.5">
                  {s.level}
                </span>
              </div>
              <h3 className="mt-3 font-bold text-base">
                {isId ? s.title_id : s.title_en}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">
                {isId ? s.description_id : s.description_en}
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {isId ? "Mulai Latihan" : "Start Practice"}
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
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
            <p className="text-sm text-muted-foreground">
              {isId
                ? "Belum ada sesi yang selesai. Mulai latihan pertama kamu di atas."
                : "No completed sessions yet. Start your first practice above."}
            </p>
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
