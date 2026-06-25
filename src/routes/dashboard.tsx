import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Flame,
  ArrowRight,
  RotateCw,
  X,
  Briefcase,
  CheckCircle2,
  Lock,
  BookOpen,
  RefreshCw,
  Trophy,
} from "lucide-react";
import {
  getHistory,
  getFavorites,
  getStreakDays,
  getIntentCounts,
  getOldestReviewedFavorites,
  rateReview,
  useLocalCollection,
  type HistoryEntry,
  type FavoriteEntry,
} from "@/lib/storage";
import { StylePill, JlptRef, cleanJapanese, useIntentLabel } from "@/components/result-parts";
import { SpeakerButton } from "@/components/SpeakerButton";
import { useT } from "@/lib/i18n";
import type { IntentType } from "@/lib/translate.functions";
import { useAuth } from "@/lib/auth";
import { SignInButton } from "@/components/SignInButton";
import { getMyInterviewSessions, type InterviewSessionSummary } from "@/lib/interview-history.functions";
import { getDueReviews } from "@/lib/review.functions";
import { getCurriculumOverview, localizeCurriculumOverview, type LevelNode } from "@/lib/curriculum.functions";
import { applyLearningProgressToOverview, readLearningProgress, subscribeLearningProgress } from "@/lib/learning-progress";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Levelku — Nihongolive" },
      {
        name: "description",
        content:
          "Pantau progress kurikulum, streak harian, dan item yang perlu diulang dalam dashboard belajar bahasa Jepang kamu.",
      },
      { property: "og:title", content: "Levelku — Nihongolive" },
      { property: "og:description", content: "Progress kurikulum, streak, dan review harian." },
      { property: "og:url", content: "/dashboard" },
    ],
    links: [{ rel: "canonical", href: "/dashboard" }],
  }),
  component: DashboardPage,
});




function DashboardPage() {
  const { t, lang } = useT();
  const { profile, user } = useAuth();
  const [history] = useLocalCollection<HistoryEntry>(getHistory);
  const [favs] = useLocalCollection<FavoriteEntry>(getFavorites);
  const [oldest] = useLocalCollection(getOldestReviewedFavorites);
  const navigate = useNavigate();

  const fetchSessions = useServerFn(getMyInterviewSessions);
  const interviewQuery = useQuery({
    queryKey: ["interview-sessions"],
    queryFn: () => fetchSessions(),
    enabled: !!user,
    staleTime: 30_000,
  });

  const fetchDue = useServerFn(getDueReviews);
  const dueQuery = useQuery({
    queryKey: ["due-reviews", user?.id],
    queryFn: () => fetchDue(),
    enabled: !!user,
    staleTime: 60_000,
  });
  const dueItems = dueQuery.data ?? [];

  const fetchOverview = useServerFn(getCurriculumOverview);
  const overviewQuery = useQuery({
    queryKey: ["curriculum-overview", user?.id],
    queryFn: () => fetchOverview(),
    enabled: !!user,
    staleTime: 30_000,
  });
  const progressVersion = useSyncExternalStore(
    subscribeLearningProgress,
    () => JSON.stringify(readLearningProgress(user?.id ?? null)),
    () => "{}",
  );
  const overview = useMemo(
    () => localizeCurriculumOverview(applyLearningProgressToOverview(overviewQuery.data, JSON.parse(progressVersion)), lang),
    [overviewQuery.data, progressVersion, lang],
  );

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="mx-auto mb-5 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-3xl">
          📊
        </div>
        <h2 className="text-xl font-bold">{t("dash.signin.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("dash.signin.desc")}</p>
        <div className="mt-6 flex justify-center">
          <SignInButton />
        </div>
      </div>
    );
  }

  const streak = getStreakDays();
  const intentCounts = useMemo(() => getIntentCounts(), [history]);

  const SUGGESTIONS: Record<IntentType, string> = {
    monolog: t("sugg.monolog"),
    asking_others: t("sugg.asking_others"),
    casual_conversation: t("sugg.casual_conversation"),
    professional_formal: t("sugg.professional_formal"),
    joking_relaxed: t("sugg.joking_relaxed"),
  };

  const daysAgo = (iso: string | null): string => {
    if (!iso) return t("dash.daysAgo.never");
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
    if (days <= 0) return t("dash.daysAgo.today");
    if (days === 1) return t("dash.daysAgo.oneDay");
    return `${days} ${t("dash.daysAgo.suffix")}`;
  };

  const styleCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of favs) {
      const lvl = (f.level || "").toUpperCase();
      if (!lvl) continue;
      m.set(lvl, (m.get(lvl) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [favs]);
  const topStyle = styleCounts[0];

  const triedIntents = new Set(history.map((h) => h.intent.type));
  const allIntents = Object.keys(SUGGESTIONS) as IntentType[];
  const untried = allIntents.filter((t2) => !triedIntents.has(t2));

  const [modalFav, setModalFav] = useState<FavoriteEntry | null>(null);

  const handleSuggest = (text: string) => {
    sessionStorage.setItem("nihongo_prefill", text);
    navigate({ to: "/translate" });
  };

  const sessions = interviewQuery.data ?? [];
  const completed = sessions.filter((s) => s.completed);
  const avg = (key: "grammar_score" | "naturalness_score" | "confidence_score") => {
    const vals = completed.map((s) => s[key]).filter((v): v is number => typeof v === "number");
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  const avgGrammar = avg("grammar_score");
  const avgNatural = avg("naturalness_score");
  const avgConfidence = avg("confidence_score");

  const greetingName =
    overview?.full_name?.split(" ")[0] ||
    profile?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    (lang === "en" ? "there" : "kamu");

  const currentLevel = overview?.levels.find((l) => l.status === "current");

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Greeting */}
      <h1 className="text-2xl sm:text-3xl font-bold text-violet-900">
        {t("dash.welcome").replace("{name}", greetingName)}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {overview?.last_session
          ? t("dash.continue_from")
              .replace("{level}", overview.last_session.level_name)
              .replace("{unit}", overview.last_session.unit_name)
          : overview?.next_session
            ? t("dash.start_from")
                .replace("{level}", overview.next_session.level_name)
                .replace("{unit}", overview.next_session.unit_name)
            : t("dash.ready")}
      </p>

      {/* 2. Streak banner */}
      <div className="rounded-2xl bg-violet-900 text-white p-5 mb-5 flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-lime-500 text-violet-900 flex-shrink-0">
          <Flame className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold leading-none">
            {streak} <span className="text-base font-normal text-white/70">{t("dash.streak_label")}</span>
          </p>
          <p className="text-xs text-white/60 mt-1">
            {dueItems.length > 0
              ? t("dash.due_items").replace("{count}", String(dueItems.length))
              : t("dash.keep_going")}
          </p>
        </div>
        {dueItems.length > 0 ? (
          <Link
            to="/belajar/review"
            className="inline-flex items-center gap-1.5 rounded-xl bg-lime-500 hover:bg-lime-400 px-4 py-2.5 text-sm font-bold text-violet-900 transition flex-shrink-0"
          >
            {t("dash.review_today")} <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/80 flex-shrink-0">
            {t("dash.all_done")}
          </span>
        )}
      </div>

      {/* 3. Continue card */}
      {overview?.next_session ? (
        <div className="rounded-2xl bg-violet-600 text-white p-6 mb-6">
          <p className="text-xs uppercase tracking-wide font-semibold text-violet-100/80">
            {overview.next_session.level_name} · {overview.next_session.unit_name}
          </p>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 mb-4">
            {overview.next_session.session_title}
          </h2>
          <div className="h-2 rounded-full bg-violet-900/40 overflow-hidden mb-4">
            <div
              className="h-full bg-lime-500 transition-all"
              style={{ width: `${overview.next_session.unit_progress_pct}%` }}
            />
          </div>
          <Link
            to="/belajar/$sessionId"
            params={{ sessionId: overview.next_session.session_id }}
            className="inline-flex items-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-400 px-5 py-3 text-sm font-bold text-violet-900 transition"
          >
            {t("dash.continue_session")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : overviewQuery.isLoading ? (
        <div className="rounded-2xl bg-violet-100 p-6 mb-6 animate-pulse h-32" />
      ) : (
        <div className="rounded-2xl bg-lime-100 border border-lime-300 p-6 mb-6 text-center">
          <Trophy className="w-8 h-8 text-lime-700 mx-auto mb-2" />
          <p className="font-bold text-violet-900">{t("dash.all_sessions_done")}</p>
          <p className="text-sm text-violet-900/70 mt-1">{t("dash.new_levels_soon")}</p>
        </div>
      )}

      {/* 4. Mini stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <MiniStat
          icon={<BookOpen className="w-4 h-4" />}
          label={t("dash.sentences_learned")}
          value={overview?.items_learned ?? 0}
        />
        <MiniStat
          icon={<RefreshCw className="w-4 h-4" />}
          label={t("dash.need_review")}
          value={dueItems.length}
        />
        <MiniStat
          icon={<Trophy className="w-4 h-4" />}
          label={t("dash.current_level")}
          value={currentLevel ? `L${currentLevel.order_index}` : "—"}
        />
      </div>

      {/* 5. Learning path */}
      <Section title={t("dash.learning_path")}>
        {overviewQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("dash.loading")}</p>
        ) : (
          <div className="space-y-3">
            {(overview?.levels ?? []).map((lvl) => (
              <LevelRow key={lvl.id} level={lvl} />
            ))}
          </div>
        )}
      </Section>

      {/* Interview progress */}
      <Section title={t("dash.iv.title")}>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">{t("dash.iv.label")}</p>
          </div>
          {interviewQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("dash.iv.loading")}</p>
          ) : sessions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">{t("dash.iv.empty")}</p>
              <Link
                to="/interview"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                {t("dash.iv.start")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <ScoreBox label="Grammar" value={avgGrammar} />
                <ScoreBox label="Naturalness" value={avgNatural} />
                <ScoreBox label="Confidence" value={avgConfidence} />
              </div>
              <p className="text-[11px] uppercase font-semibold tracking-wide text-muted-foreground mb-2">
                {t("dash.iv.lastSessions")}
              </p>
              <div className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <SessionRow key={s.id} s={s} />
                ))}
              </div>
              <Link
                to="/interview"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                {t("dash.iv.newSession")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </Section>

      {/* Untried situations */}
      <Section title={t("dash.untried")}>
        {untried.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dash.allTried")}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-2">{t("dash.tapToTry")}</p>
            <div className="grid gap-2">
              {untried.map((it) => (
                <UntriedRow
                  key={it}
                  intentType={it}
                  text={SUGGESTIONS[it]}
                  onClick={() => handleSuggest(SUGGESTIONS[it])}
                />
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Learning patterns */}
      <Section title={t("dash.patterns")}>
        <div className="grid sm:grid-cols-2 gap-3">
          <PatternCard title={t("dash.topIntent")}>
            {intentCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dash.noData")}</p>
            ) : (
              <ul className="space-y-2">
                {intentCounts.slice(0, 3).map(({ type, count }) => (
                  <IntentCountRow key={type} type={type} count={count} />
                ))}
              </ul>
            )}
          </PatternCard>

          <PatternCard title={t("dash.topStyle")}>
            {topStyle ? (
              <div>
                <StylePill level={topStyle[0]} />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("dash.styleAppeared")} {topStyle[1]}
                  {t("dash.styleAppearedSuffix")} <JlptRef level={topStyle[0]} />
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("dash.styleHint")}</p>
            )}
          </PatternCard>
        </div>

        {oldest.length > 0 && (
          <div className="grid gap-3 mt-3">
            <p className="text-[11px] uppercase font-semibold tracking-wide text-muted-foreground">
              {t("dash.almostForgot")}
            </p>
            {oldest.slice(0, 3).map(({ fav, lastReviewed }) => (
              <div key={fav.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-2">
                  <p className="font-jp text-xl leading-snug flex-1 break-words">
                    {cleanJapanese(fav.japanese)}
                  </p>
                  <SpeakerButton text={cleanJapanese(fav.japanese)} size="sm" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">"{fav.input}"</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {t("dash.lastSeen")} {daysAgo(lastReviewed)}
                  </span>
                  <button
                    onClick={() => setModalFav(fav)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> {t("dash.reviewNow")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {modalFav && <QuickReviewModal fav={modalFav} onClose={() => setModalFav(null)} />}
    </div>
  );
}

function LevelRow({ level }: { level: LevelNode }) {
  const locked = level.status === "locked";
  const completed = level.status === "completed";
  const current = level.status === "current";
  const { t } = useT();

  const inner = (
    <div
      className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
        locked
          ? "bg-muted/40 border-border opacity-60 cursor-not-allowed"
          : "bg-white border-violet-100 hover:border-violet-300 hover:bg-violet-50"
      }`}
    >
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold flex-shrink-0 ${
          completed
            ? "bg-lime-500 text-violet-900"
            : current
              ? "bg-violet-600 text-white"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {completed ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : locked ? (
          <Lock className="w-5 h-5" />
        ) : (
          <span>{level.order_index}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${locked ? "text-muted-foreground" : "text-violet-900"}`}>
          {level.name}
        </p>
        <div className="mt-1.5 h-1.5 rounded-full bg-violet-100 overflow-hidden">
          <div
            className={`h-full ${completed ? "bg-lime-500" : "bg-violet-600"}`}
            style={{ width: `${level.progress_pct}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          {completed
            ? t("dash.level_lulus")
            : locked
              ? t("dash.level_locked")
              : t("dash.level_progress").replace("{pct}", String(level.progress_pct))}
        </p>
      </div>
    </div>
  );

  if (locked) return <div>{inner}</div>;
  return (
    <Link to="/belajar/level/$levelId" params={{ levelId: level.id }} className="block">
      {inner}
    </Link>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4">
      <div className="flex items-center gap-1.5 text-violet-700 mb-1.5">
        {icon}
        <p className="text-[10px] uppercase font-semibold tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold text-violet-900">{value}</p>
    </div>
  );
}

function UntriedRow({
  intentType,
  text,
  onClick,
}: {
  intentType: IntentType;
  text: string;
  onClick: () => void;
}) {
  const meta = useIntentLabel(intentType);
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl border border-border bg-background hover:bg-muted/50 hover:border-primary/40 transition px-4 py-3 group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-white px-2 py-0.5 rounded-full mb-1.5"
            style={{ backgroundColor: `var(--intent-${intentType})` }}
          >
            {meta.emoji} {meta.short}
          </span>
          <p className="text-sm text-foreground truncate">"{text}"</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition flex-shrink-0" />
      </div>
    </button>
  );
}

function IntentCountRow({ type, count }: { type: IntentType; count: number }) {
  const meta = useIntentLabel(type);
  return (
    <li className="flex items-center justify-between gap-2">
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-white px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `var(--intent-${type})` }}
      >
        {meta.emoji} {meta.short}
      </span>
      <span className="text-sm font-bold">{count}</span>
    </li>
  );
}

function PatternCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground/80">
        {title}
      </h2>
      {children}
    </section>
  );
}

function QuickReviewModal({ fav, onClose }: { fav: FavoriteEntry; onClose: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const { t } = useT();

  const handle = (correct: boolean) => {
    rateReview(fav.id, correct);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted transition"
          aria-label={t("qrm.close")}
        >
          <X className="w-4 h-4" />
        </button>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          {t("qrm.q")}
        </p>
        <p className="text-lg font-semibold">{fav.input}</p>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="mt-5 w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition"
          >
            {t("qrm.show")}
          </button>
        ) : (
          <>
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-start gap-2">
                <p className="font-jp text-2xl leading-snug flex-1 break-words">
                  {cleanJapanese(fav.japanese)}
                </p>
                <SpeakerButton text={cleanJapanese(fav.japanese)} />
              </div>
              <p className="mt-1 italic text-sm text-muted-foreground">{fav.romaji}</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <StylePill level={fav.level} size="sm" />
                <JlptRef level={fav.level} />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => handle(false)}
                className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive py-2.5 text-sm font-semibold hover:bg-destructive/15 transition"
              >
                {t("qrm.forgot")}
              </button>
              <button
                onClick={() => handle(true)}
                className="rounded-lg border border-foreground/15 bg-[#D9F26B] text-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition"
              >
                {t("qrm.remember")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreBox({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-center">
      <p className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">
        {value !== null ? value : "–"}
        {value !== null && <span className="text-xs font-normal text-muted-foreground">/100</span>}
      </p>
    </div>
  );
}

function SessionRow({ s }: { s: InterviewSessionSummary }) {
  const { t, lang } = useT();
  const date = new Date(s.created_at).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short" });
  const avg =
    s.completed && s.grammar_score !== null && s.naturalness_score !== null && s.confidence_score !== null
      ? Math.round((s.grammar_score + s.naturalness_score + s.confidence_score) / 3)
      : null;
  return (
    <Link
      to="/interview"
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/40 transition px-3 py-2.5"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{s.scenario_title}</p>
        <p className="text-[11px] text-muted-foreground">{date}{s.vocabulary_level ? ` · ${s.vocabulary_level}` : ""}</p>
      </div>
      {avg !== null ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">
          {avg}/100
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
          {s.completed ? t("dash.iv.done") : t("dash.iv.ongoing")}
        </span>
      )}
    </Link>
  );
}
