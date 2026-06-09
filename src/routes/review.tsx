import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, X, RotateCw } from "lucide-react";
import {
  getDueReviewFavorites,
  rateReview,
  useLocalCollection,
  getHistory,
  addChallengeResult,
  getChallengeResultsToday,
  type FavoriteEntry,
  type HistoryEntry,
} from "@/lib/storage";
import { StylePill, JlptRef, cleanJapanese } from "@/components/result-parts";
import { SpeakerButton } from "@/components/SpeakerButton";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { LockedFeature } from "@/components/LockedFeature";

export const Route = createFileRoute("/review")({
  head: () => ({ meta: [{ title: "Latihan Harian — NihongoLevel" }] }),
  component: ReviewPage,
});

type Tab = "flashcard" | "situasi";

function ReviewPage() {
  const { t } = useT();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("flashcard");
  if (!user) return <LockedFeature />;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{t("rev.title")}</h1>

      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-muted/60 border border-border w-fit">
        {(
          [
            { id: "flashcard", label: t("rev.tab.flash") },
            { id: "situasi", label: t("rev.tab.situ") },
          ] as { id: Tab; label: string }[]
        ).map((tt) => (
          <button
            key={tt.id}
            onClick={() => setTab(tt.id)}
            className={cn(
              "px-4 py-1.5 text-sm font-semibold rounded-lg transition",
              tab === tt.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tt.label}
          </button>
        ))}
      </div>

      {tab === "flashcard" ? <FlashcardMode /> : <SituasiMode />}
    </div>
  );
}

function FlashcardMode() {
  const { t } = useT();
  const [due] = useLocalCollection<FavoriteEntry>(getDueReviewFavorites);
  const [session, setSession] = useState<FavoriteEntry[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (session === null && due.length > 0) setSession(due);
  }, [due, session]);

  const total = session?.length ?? due.length;
  const current = session?.[idx];
  const dueCount = useMemo(() => due.length, [due]);

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <p className="font-semibold">{t("rev.empty.title")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("rev.empty.desc")}</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-3xl mb-2">🎉</p>
        <p className="font-semibold text-lg">{t("rev.sessionDone")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("rev.reviewed")} {total} {t("rev.expressionsToday")}
        </p>
        <button
          onClick={() => {
            setSession(null);
            setIdx(0);
            setRevealed(false);
          }}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          <RotateCw className="w-4 h-4" /> {t("rev.newSession")}
        </button>
      </div>
    );
  }

  const handleRate = (correct: boolean) => {
    rateReview(current.id, correct);
    setRevealed(false);
    setIdx((i) => i + 1);
  };

  const progress = (idx / total) * 100;

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm text-muted-foreground mb-1">
          {dueCount} {t("rev.readyToday")}
        </p>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {idx + 1} / {total}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
          {t("rev.tryRemember")}
        </p>
        <p className="text-xl sm:text-2xl font-semibold text-foreground">{current.input}</p>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="mt-6 w-full rounded-lg bg-primary text-primary-foreground px-5 py-3 text-sm font-medium hover:opacity-90 transition"
          >
            {t("rev.showAnswer")}
          </button>
        ) : (
          <>
            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-start gap-2">
                <p className="font-jp text-3xl sm:text-4xl leading-snug text-foreground flex-1 break-words">
                  {cleanJapanese(current.japanese)}
                </p>
                <SpeakerButton text={cleanJapanese(current.japanese)} />
              </div>
              <p className="mt-2 italic text-sm text-muted-foreground">{current.romaji}</p>
              {current.meaning && (
                <p className="mt-3 text-sm text-foreground/80">{current.meaning}</p>
              )}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <StylePill level={current.level} size="sm" />
                <JlptRef level={current.level} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRate(false)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-5 py-3 text-sm font-semibold hover:bg-destructive/15 transition"
              >
                <X className="w-4 h-4" /> {t("qrm.forgot")}
              </button>
              <button
                onClick={() => handleRate(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 text-green-700 px-5 py-3 text-sm font-semibold hover:bg-green-500/15 transition"
              >
                <Check className="w-4 h-4" /> {t("qrm.remember")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface Challenge {
  historyId: number;
  input: string;
  casual: string;
  casualRomaji: string;
  formal: string;
  formalRomaji: string;
  formalGrammar: { pattern: string; explanation: string }[];
}

function buildChallenges(history: HistoryEntry[]): Challenge[] {
  return history
    .filter((h) => h.levels?.n4?.japanese && h.levels?.n1?.japanese)
    .map((h) => ({
      historyId: h.id,
      input: h.input,
      casual: cleanJapanese(h.levels.n4.japanese),
      casualRomaji: h.levels.n4.romaji,
      formal: cleanJapanese(h.levels.n1.japanese),
      formalRomaji: h.levels.n1.romaji,
      formalGrammar: h.levels.n1.grammar ?? [],
    }));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function SituasiMode() {
  const { t } = useT();
  const [history] = useLocalCollection<HistoryEntry>(getHistory);
  const allChallenges = useMemo(() => buildChallenges(history), [history]);
  const totalAvailable = allChallenges.length;

  const [session, setSession] = useState<Challenge[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState<"attempt" | "reveal">("attempt");
  const [attempt, setAttempt] = useState("");
  const [doneToday, setDoneToday] = useState(getChallengeResultsToday().length);

  useEffect(() => {
    if (session === null && allChallenges.length > 0) {
      setSession(shuffle(allChallenges).slice(0, 5));
    }
  }, [allChallenges, session]);

  if (totalAvailable === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <p className="font-semibold">{t("sit.empty.title")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("sit.empty.desc")}</p>
      </div>
    );
  }

  const sessionTotal = session?.length ?? 0;
  const current = session?.[idx];

  if (!current) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-3xl mb-2">🎯</p>
        <p className="font-semibold text-lg">{t("sit.done")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("sit.totalToday")} {doneToday}
        </p>
        <button
          onClick={() => {
            setSession(shuffle(allChallenges).slice(0, 5));
            setIdx(0);
            setStep("attempt");
            setAttempt("");
          }}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          <RotateCw className="w-4 h-4" /> {t("sit.newSession")}
        </button>
      </div>
    );
  }

  const handleRate = (success: boolean) => {
    addChallengeResult(current.historyId, success);
    setDoneToday((c) => c + 1);
    setStep("attempt");
    setAttempt("");
    setIdx((i) => i + 1);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {totalAvailable} {t("sit.available")}
        </p>
        <p className="text-xs font-semibold text-foreground">
          {Math.min(idx, sessionTotal)} / {sessionTotal} {t("sit.sessionProgress")}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
          {t("sit.challenge")} {idx + 1}
        </p>
        <p className="text-sm text-foreground/80">{t("sit.knowHow")}</p>
        <div className="mt-2 flex items-start gap-2">
          <p className="font-jp text-2xl leading-snug flex-1 break-words">{current.casual}</p>
          <SpeakerButton text={current.casual} size="sm" />
        </div>
        <p className="italic text-xs text-muted-foreground">{current.casualRomaji}</p>

        <p className="mt-5 text-sm font-semibold text-foreground">
          {t("sit.howToBoss")} <span className="text-primary">{t("sit.boss")}</span>?
        </p>

        {step === "attempt" ? (
          <>
            <textarea
              value={attempt}
              onChange={(e) => setAttempt(e.target.value)}
              placeholder={t("sit.attemptPlaceholder")}
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            <button
              onClick={() => setStep("reveal")}
              className="mt-3 w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              {t("sit.showIdeal")}
            </button>
          </>
        ) : (
          <>
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-1">
                {t("sit.formalVersion")}
              </p>
              <div className="flex items-start gap-2">
                <p className="font-jp text-2xl sm:text-3xl leading-snug flex-1 break-words">
                  {current.formal}
                </p>
                <SpeakerButton text={current.formal} />
              </div>
              <p className="italic text-sm text-muted-foreground mt-1">{current.formalRomaji}</p>

              {attempt.trim() && (
                <div className="mt-4 rounded-lg bg-muted/60 p-3 text-sm">
                  <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-1">
                    {t("sit.yourAnswer")}
                  </p>
                  <p className="text-foreground/80">{attempt}</p>
                </div>
              )}

              {current.formalGrammar.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-2">
                    {t("sit.mainDiff")}
                  </p>
                  <ul className="space-y-2">
                    {current.formalGrammar.slice(0, 2).map((g, i) => (
                      <li key={i} className="rounded-lg border border-border p-3 text-sm">
                        <p className="font-jp font-medium">{g.pattern}</p>
                        <p className="mt-1 text-muted-foreground">{g.explanation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="mt-5 text-sm font-semibold">{t("sit.closeEnough")}</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRate(false)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-5 py-3 text-sm font-semibold hover:bg-destructive/15 transition"
              >
                <X className="w-4 h-4" /> {t("sit.no")}
              </button>
              <button
                onClick={() => handleRate(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 text-green-700 px-5 py-3 text-sm font-semibold hover:bg-green-500/15 transition"
              >
                <Check className="w-4 h-4" /> {t("sit.yes")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
