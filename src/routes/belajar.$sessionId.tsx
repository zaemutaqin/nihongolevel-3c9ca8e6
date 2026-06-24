import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SpeakerButton } from "@/components/SpeakerButton";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DoneScreen,
  ListenStage,
  QuizStage,
  type LearnItem,
} from "@/components/learn-stages";
import { reviewItem } from "@/lib/review.functions";
import { getSessionDetail, findNextSessionId } from "@/lib/curriculum.functions";
import { useT } from "@/lib/i18n";
import { getStoredSessionProgress, saveStoredSessionProgress } from "@/lib/learning-progress";

export const Route = createFileRoute("/belajar/$sessionId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sesi belajar — NihongoLevel" },
      {
        name: "description",
        content:
          "Sesi belajar interaktif NihongoLevel — pelajari kosakata dan kalimat Jepang baru lewat tahap learn, listen, dan quiz singkat.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BelajarPage,
});

type Phase = "learn" | "listen" | "quiz" | "done";

function seededShuffle<T extends { id: string }>(arr: T[], seed: string): T[] {
  const hash = (value: string) => {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  return [...arr].sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`));
}

function BelajarPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { lang } = useT();
  const { user } = useAuth();
  const [startedAt] = useState(() => Date.now());

  const fetchSession = useServerFn(getSessionDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["belajar-session", sessionId, lang],
    queryFn: async () => {
      const detail = await fetchSession({ data: sessionId });
      if (!detail) return null;
      const items: LearnItem[] = detail.items.map((it) => ({
        id: it.id,
        type: it.type,
        content_jp: it.content_jp,
        content_romaji: it.content_romaji,
        content_meaning: lang === "en" ? it.content_meaning_en : it.content_meaning,
      }));
      return {
        session: { id: detail.id, title: lang === "en" ? detail.title_en : detail.title, unit_id: detail.unit_id },
        items,
        nextSessionId: findNextSessionId(sessionId),
      };
    },
  });

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center text-violet-900">Memuat sesi…</div>;
  }
  if (!data || data.items.length === 0) {
    const isLevel1 = sessionId.startsWith("level-1-");
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div className="max-w-sm">
          <p className="mb-4 text-violet-900 font-semibold">
            {isLevel1
              ? "Konten Level 1 akan segera tersedia. Selesaikan Level 0 dulu."
              : "Konten sedang disiapkan untuk sesi ini."}
          </p>
          <Link
            to="/dashboard"
            className="inline-block rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-semibold px-5 py-3"
          >
            Kembali ke dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SessionRunner
      sessionId={sessionId}
      items={data.items}
      title={data.session.title}
      nextSessionId={data.nextSessionId}
      userId={user?.id ?? null}
      startedAt={startedAt}
      onClose={() => navigate({ to: "/dashboard" })}
    />
  );
}

function SessionRunner({
  sessionId,
  items,
  title,
  nextSessionId,
  userId,
  startedAt,
  onClose,
}: {
  sessionId: string;
  items: LearnItem[];
  title: string;
  nextSessionId: string | null;
  userId: string | null;
  startedAt: number;
  onClose: () => void;
}) {
  const review = useServerFn(reviewItem);
  const stored = useMemo(() => getStoredSessionProgress(userId, sessionId), [userId, sessionId]);
  const [phase, setPhase] = useState<Phase>(() => (stored?.phase === "done" ? "done" : stored?.phase ?? "learn"));
  const [learnIdx, setLearnIdx] = useState(() => Math.min(stored?.learnIdx ?? 0, Math.max(0, items.length - 1)));
  const [listenIdx, setListenIdx] = useState(() => stored?.listenIdx ?? 0);
  const [quizIdx, setQuizIdx] = useState(() => stored?.quizIdx ?? 0);
  const [lives, setLives] = useState(() => stored?.lives ?? 5);
  const [correctIds, setCorrectIds] = useState<Set<string>>(() => new Set(stored?.correctIds ?? []));
  const [wrongIds, setWrongIds] = useState<Set<string>>(() => new Set(stored?.wrongIds ?? []));
  const [saved, setSaved] = useState(false);

  const listenItems = useMemo(() => seededShuffle(items, `${sessionId}:listen`).slice(0, Math.min(items.length, 6)), [items, sessionId]);
  const quizItems = useMemo(() => seededShuffle(items, `${sessionId}:quiz`).slice(0, Math.min(items.length, 6)), [items, sessionId]);

  const totalSteps = items.length + listenItems.length + quizItems.length;
  const [step, setStep] = useState(() => Math.min(stored?.step ?? 0, totalSteps));
  const progressPct = Math.round((step / Math.max(1, totalSteps)) * 100);

  const persistProgress = useCallback(
    (completed = phase === "done") => {
      const totalAnswered = listenItems.length + quizItems.length;
      const scorePct = completed
        ? totalAnswered === 0
          ? 100
          : Math.round((correctIds.size / totalAnswered) * 100)
        : null;
      saveStoredSessionProgress(userId, sessionId, {
        phase,
        learnIdx,
        listenIdx,
        quizIdx,
        step,
        totalSteps,
        lives,
        correctIds: Array.from(correctIds),
        wrongIds: Array.from(wrongIds),
        completed,
        scorePct,
      });
    },
    [correctIds, learnIdx, listenIdx, lives, phase, quizIdx, quizItems.length, sessionId, step, totalSteps, userId, wrongIds, listenItems.length],
  );

  useEffect(() => {
    persistProgress(phase === "done");
  }, [persistProgress, phase]);

  useEffect(() => {
    const onBeforeUnload = () => persistProgress(phase === "done");
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [persistProgress, phase]);

  const recordAnswer = useCallback(
    (item: LearnItem, correct: boolean) => {
      if (correct) {
        setCorrectIds((s) => new Set(s).add(item.id));
      } else {
        setWrongIds((s) => new Set(s).add(item.id));
        setLives((l) => Math.max(0, l - 1));
      }
      setStep((s) => s + 1);
      if (userId) {
        review({ data: { itemId: item.id, response: correct ? "good" : "again" } }).catch((e) => {
          console.error("reviewItem failed", e);
        });
      }
    },
    [review, userId],
  );

  // Save session attempt only (item_progress is updated per answer via reviewItem)
  useEffect(() => {
    if (phase !== "done" || saved || !userId) return;
    const totalAnswered = listenItems.length + quizItems.length;
    const scorePct =
      totalAnswered === 0 ? 100 : Math.round((correctIds.size / totalAnswered) * 100);
    const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const now = new Date().toISOString();
    (async () => {
      try {
        await supabase.from("session_attempts").insert({
          user_id: userId,
          session_id: sessionId,
          score_pct: scorePct,
          duration_sec: durationSec,
          completed_at: now,
        });
        persistProgress(true);
        setSaved(true);
      } catch (e) {
        console.error(e);
        toast.error("Gagal menyimpan progres sesi");
      }
    })();
  }, [
    phase,
    saved,
    userId,
    correctIds.size,
    listenItems.length,
    quizItems.length,
    sessionId,
    startedAt,
    persistProgress,
  ]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center gap-4 px-4 sm:px-6 py-4 border-b border-violet-100">
        <button
          onClick={() => {
            persistProgress(phase === "done");
            onClose();
          }}
          aria-label="Tutup sesi"
          className="rounded-full p-2 hover:bg-violet-50 text-violet-900"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 h-3 rounded-full bg-violet-100 overflow-hidden">
          <div className="h-full bg-lime-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex items-center gap-1 text-violet-900 font-semibold">
          <Heart className="h-5 w-5 fill-lime-500 text-lime-600" />
          <span>{lives}</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        {phase === "learn" && (
          <LearnStage
            items={items}
            index={learnIdx}
            onPrev={() => setLearnIdx((i) => Math.max(0, i - 1))}
            onNext={() => {
              if (learnIdx >= items.length - 1) {
                setPhase("listen");
                setStep(items.length);
              } else {
                setLearnIdx((i) => i + 1);
                setStep((s) => s + 1);
              }
            }}
          />
        )}
        {phase === "listen" && (
          <ListenStage
            allItems={items}
            queue={listenItems}
            initialIndex={listenIdx}
            onIndexChange={setListenIdx}
            onAnswer={recordAnswer}
            onDone={() => {
              setListenIdx(Math.max(0, listenItems.length - 1));
              setPhase("quiz");
            }}
          />
        )}
        {phase === "quiz" && (
          <QuizStage
            allItems={items}
            queue={quizItems}
            initialIndex={quizIdx}
            onIndexChange={setQuizIdx}
            onAnswer={recordAnswer}
            onDone={() => {
              setQuizIdx(Math.max(0, quizItems.length - 1));
              setPhase("done");
            }}
          />
        )}
        {phase === "done" && (
          <DoneScreen
            title="Sesi selesai"
            subtitle={title}
            mastered={correctIds.size}
            xp={correctIds.size * 10}
            primaryHref={nextSessionId ? "/belajar/$sessionId" : "/dashboard"}
            primaryParams={nextSessionId ? { sessionId: nextSessionId } : undefined}
            primaryLabel={nextSessionId ? "Lanjut ke sesi berikutnya" : "Selesaikan unit"}
            onRetry={() => window.location.reload()}
          />
        )}
      </main>
    </div>
  );
}

function LearnStage({
  items,
  index,
  onPrev,
  onNext,
}: {
  items: LearnItem[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { lang } = useT();
  const item = items[index];
  const isLast = index >= items.length - 1;
  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-8">
      <div className="w-full rounded-3xl bg-violet-50 border border-violet-100 p-8 sm:p-12 flex flex-col items-center text-center shadow-sm">
        <div className="mb-6">
          <SpeakerButton text={item.content_jp} />
        </div>
        <div className="text-7xl sm:text-8xl font-bold text-violet-900 leading-tight">
          {item.content_jp}
        </div>
        {item.content_romaji && (
          <div className="mt-4 text-2xl text-violet-700">{item.content_romaji}</div>
        )}
        {item.content_meaning && (
          <div className="mt-2 text-base text-violet-900/70">{item.content_meaning}</div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        {items.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 rounded-full transition-all",
              i === index ? "w-6 bg-violet-700" : i < index ? "w-2 bg-violet-300" : "w-2 bg-violet-100",
            )}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 w-full">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="flex-1 px-5 py-3 rounded-xl border border-violet-200 text-violet-900 font-semibold disabled:opacity-40"
        >
          {lang === "en" ? "Previous" : "Sebelumnya"}
        </button>
        <button
          onClick={onNext}
          className="flex-[2] px-5 py-3 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-semibold"
        >
          {isLast
            ? lang === "en"
              ? "Continue to listening practice"
              : "Lanjut ke latihan dengar"
            : lang === "en"
              ? "Next"
              : "Selanjutnya"}
        </button>
      </div>
    </div>
  );
}
