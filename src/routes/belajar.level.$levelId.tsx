import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useSyncExternalStore } from "react";
import { ArrowLeft, CheckCircle2, Circle, Lock } from "lucide-react";
import { getCurriculumOverview, localizeCurriculumOverview } from "@/lib/curriculum.functions";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { applyLearningProgressToOverview, readLearningProgress, subscribeLearningProgress } from "@/lib/learning-progress";

export const Route = createFileRoute("/belajar/level/$levelId")({
  head: () => ({
    meta: [
      { title: "Daftar Unit — NihongoLevel" },
      {
        name: "description",
        content:
          "Jelajahi unit-unit pembelajaran bahasa Jepang per level — dari hiragana dasar hingga percakapan kerja, lengkap dengan progres tiap sesi.",
      },
    ],
  }),
  component: LevelDetailPage,
});

function LevelDetailPage() {
  const { levelId } = Route.useParams();
  const { lang } = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const progressVersion = useSyncExternalStore(
    subscribeLearningProgress,
    () => JSON.stringify(readLearningProgress(user?.id ?? null)),
    () => "{}",
  );
  const fetchOverview = useServerFn(getCurriculumOverview);
  const q = useQuery({
    queryKey: ["curriculum-overview", user?.id ?? "anon"],
    queryFn: () => fetchOverview(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!user && !q.isLoading) navigate({ to: "/auth" });
  }, [user, q.isLoading, navigate]);

  const overview = localizeCurriculumOverview(
    applyLearningProgressToOverview(q.data, JSON.parse(progressVersion)),
    lang,
  );
  const level = overview?.levels.find((l) => l.id === levelId);
  const locked = level?.status === "locked";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-violet-700 hover:text-violet-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> {lang === "en" ? "Back to My Level" : "Kembali ke Levelku"}
      </Link>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">{lang === "en" ? "Loading…" : "Memuat…"}</p>
      ) : !level ? (
        <div className="rounded-2xl border border-border bg-muted p-6 text-center">
          <p className="text-sm">{lang === "en" ? "Level not found." : "Level tidak ditemukan."}</p>
        </div>
      ) : locked ? (
        <div className="rounded-2xl border border-border bg-muted p-6 text-center">
          <Lock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm">
            {lang === "en"
              ? "This level is still locked. Finish the previous level first."
              : "Level ini masih terkunci. Selesaikan level sebelumnya dulu."}
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-violet-900">{level.name}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {lang === "en" ? "Progress" : "Progress"}: {level.progress_pct}% · {lang === "en" ? "Unlock target" : "Lulus minimal"} {level.unlock_threshold_pct}%
          </p>

          <div className="space-y-6">
            {level.units.map((u) => (
              <section key={u.id}>
                <h2 className="text-sm font-bold uppercase tracking-wide text-violet-900/70 mb-2">
                  {lang === "en" ? "Unit" : "Unit"} {u.order_index + 1} — {u.name}
                </h2>
                <div className="space-y-2">
                  {u.sessions.map((s) => (
                    <Link
                      key={s.id}
                      to="/belajar/$sessionId"
                      params={{ sessionId: s.id }}
                      className="flex items-center gap-3 rounded-xl border border-violet-100 bg-white hover:border-violet-300 hover:bg-violet-50 transition px-4 py-3"
                    >
                      {s.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-lime-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-violet-300 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-violet-900 truncate">{s.title}</p>
                        {s.best_score !== null && (
                          <p className="text-[11px] text-muted-foreground">
                            {lang === "en" ? "Best score" : "Skor terbaik"}: {s.best_score}%
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
