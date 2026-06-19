import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Heart, Volume2, Check, ArrowRight, RotateCw, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SpeakerButton } from "@/components/SpeakerButton";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/belajar/$sessionId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sesi belajar — NihongoLevel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BelajarPage,
});

type Item = {
  id: string;
  type: string;
  content_jp: string;
  content_romaji: string | null;
  content_meaning: string | null;
};

type Phase = "learn" | "listen" | "quiz" | "done";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch {}
}

function pickChoices(items: Item[], correct: Item, field: "content_romaji" | "content_meaning" | "content_jp"): string[] {
  const others = items.filter((i) => i.id !== correct.id && i[field]);
  const pool = shuffle(others).slice(0, 3).map((i) => i[field] as string);
  const correctVal = (correct[field] as string) || correct.content_jp;
  return shuffle([correctVal, ...pool.filter((v) => v !== correctVal)]).slice(0, 4);
}

function BelajarPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [startedAt] = useState(() => Date.now());

  const { data, isLoading, error } = useQuery({
    queryKey: ["belajar-session", sessionId],
    queryFn: async () => {
      const [{ data: session, error: sErr }, { data: items, error: iErr }] = await Promise.all([
        supabase.from("sessions").select("id, unit_id, order_index, title").eq("id", sessionId).maybeSingle(),
        supabase.from("learning_items").select("id, type, content_jp, content_romaji, content_meaning").eq("session_id", sessionId),
      ]);
      if (sErr) throw sErr;
      if (iErr) throw iErr;
      if (!session) throw new Error("Sesi tidak ditemukan");
      // Find next session within same unit
      const { data: siblings } = await supabase
        .from("sessions")
        .select("id, order_index")
        .eq("unit_id", session.unit_id)
        .order("order_index", { ascending: true });
      const idx = siblings?.findIndex((s) => s.id === session.id) ?? -1;
      const nextSession = idx >= 0 && siblings ? siblings[idx + 1] : undefined;
      return { session, items: (items ?? []) as Item[], nextSessionId: nextSession?.id ?? null };
    },
  });

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center text-violet-900">Memuat sesi…</div>;
  }
  if (error || !data || data.items.length === 0) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <p className="mb-4 text-violet-900">Sesi belum tersedia.</p>
          <Link to="/dashboard" className="text-violet-700 underline">Kembali ke dashboard</Link>
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
  items: Item[];
  title: string;
  nextSessionId: string | null;
  userId: string | null;
  startedAt: number;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("learn");
  const [learnIdx, setLearnIdx] = useState(0);
  const [lives, setLives] = useState(5);
  const [correctIds, setCorrectIds] = useState<Set<string>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);

  // Pre-build practice queues for stages 2 and 3
  const listenItems = useMemo(() => shuffle(items).slice(0, Math.min(items.length, 6)), [items]);
  const quizItems = useMemo(() => shuffle(items).slice(0, Math.min(items.length, 6)), [items]);

  const totalSteps = items.length + listenItems.length + quizItems.length;
  const [step, setStep] = useState(0);
  const progressPct = Math.round((step / Math.max(1, totalSteps)) * 100);

  function recordAnswer(item: Item, correct: boolean) {
    if (correct) {
      setCorrectIds((s) => new Set(s).add(item.id));
    } else {
      setWrongIds((s) => new Set(s).add(item.id));
      setLives((l) => Math.max(0, l - 1));
    }
    setStep((s) => s + 1);
  }

  // Save when entering done phase
  useEffect(() => {
    if (phase !== "done" || saved || !userId) return;
    const seenIds = new Set<string>([...correctIds, ...wrongIds]);
    const scorePct = seenIds.size === 0
      ? 100
      : Math.round((correctIds.size / Math.max(1, listenItems.length + quizItems.length)) * 100);
    const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const fourHours = new Date(Date.now() + 4 * 3600 * 1000).toISOString();
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
        const rows = items.map((it) => {
          const wasWrong = wrongIds.has(it.id);
          return {
            user_id: userId,
            item_id: it.id,
            correct_streak: wasWrong ? 0 : 1,
            ease_factor: 2.5,
            last_seen_at: now,
            next_review_at: wasWrong ? fourHours : tomorrow,
          };
        });
        await supabase.from("item_progress").upsert(rows, { onConflict: "user_id,item_id" });
        setSaved(true);
      } catch (e) {
        console.error(e);
        toast.error("Gagal menyimpan progres");
      }
    })();
  }, [phase, saved, userId, correctIds, wrongIds, items, listenItems.length, quizItems.length, sessionId, startedAt]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-4 px-4 sm:px-6 py-4 border-b border-violet-100">
        <button
          onClick={onClose}
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
            onAnswer={recordAnswer}
            onDone={() => setPhase("quiz")}
          />
        )}
        {phase === "quiz" && (
          <QuizStage
            allItems={items}
            queue={quizItems}
            onAnswer={recordAnswer}
            onDone={() => setPhase("done")}
          />
        )}
        {phase === "done" && (
          <DoneScreen
            title={title}
            mastered={correctIds.size}
            xp={correctIds.size * 10}
            nextSessionId={nextSessionId}
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
  items: Item[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
}) {
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
              i === index ? "w-6 bg-violet-700" : i < index ? "w-2 bg-violet-300" : "w-2 bg-violet-100"
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
          Sebelumnya
        </button>
        <button
          onClick={onNext}
          className="flex-[2] px-5 py-3 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-semibold"
        >
          {isLast ? "Lanjut ke latihan dengar" : "Selanjutnya"}
        </button>
      </div>
    </div>
  );
}

function ListenStage({
  allItems,
  queue,
  onAnswer,
  onDone,
}: {
  allItems: Item[];
  queue: Item[];
  onAnswer: (item: Item, correct: boolean) => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const item = queue[i];
  const choices = useMemo(
    () => pickChoices(allItems, item, "content_jp"),
    [allItems, item]
  );
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    setPicked(null);
    // auto-play on each new question
    const t = setTimeout(() => speak(item.content_jp), 250);
    return () => clearTimeout(t);
  }, [item]);

  function choose(c: string) {
    if (picked) return;
    setPicked(c);
    const correct = c === item.content_jp;
    setTimeout(() => {
      onAnswer(item, correct);
      if (i >= queue.length - 1) onDone();
      else setI((x) => x + 1);
    }, 900);
  }

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-8">
      <p className="text-sm uppercase tracking-wide text-violet-700/70 font-semibold">
        Dengar dan pilih
      </p>
      <button
        onClick={() => speak(item.content_jp)}
        className="h-28 w-28 rounded-full bg-violet-700 hover:bg-violet-800 text-white grid place-items-center shadow-lg"
        aria-label="Putar audio"
      >
        <Volume2 className="h-12 w-12" />
      </button>
      <div className="grid grid-cols-2 gap-3 w-full">
        {choices.map((c) => {
          const isCorrect = c === item.content_jp;
          const showCorrect = picked && isCorrect;
          const showWrong = picked === c && !isCorrect;
          return (
            <button
              key={c}
              onClick={() => choose(c)}
              disabled={!!picked}
              className={cn(
                "px-4 py-6 rounded-2xl border-2 text-3xl font-bold transition-all",
                !picked && "border-violet-200 bg-white text-violet-900 hover:bg-violet-50",
                showCorrect && "border-lime-500 bg-lime-50 text-lime-700",
                showWrong && "border-red-400 bg-red-50 text-red-700",
                picked && !isCorrect && !showWrong && "opacity-50 border-violet-100"
              )}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuizStage({
  allItems,
  queue,
  onAnswer,
  onDone,
}: {
  allItems: Item[];
  queue: Item[];
  onAnswer: (item: Item, correct: boolean) => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const item = queue[i];
  const field: "content_romaji" | "content_meaning" = item.content_romaji ? "content_romaji" : "content_meaning";
  const correctVal = (item[field] as string) || "";
  const choices = useMemo(() => pickChoices(allItems, item, field), [allItems, item, field]);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    setPicked(null);
  }, [item]);

  function choose(c: string) {
    if (picked) return;
    setPicked(c);
    const correct = c === correctVal;
    setTimeout(() => {
      onAnswer(item, correct);
      if (i >= queue.length - 1) onDone();
      else setI((x) => x + 1);
    }, 900);
  }

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-8">
      <p className="text-sm uppercase tracking-wide text-violet-700/70 font-semibold">
        Pilih arti yang tepat
      </p>
      <div className="rounded-3xl bg-violet-50 border border-violet-100 px-12 py-10 text-center">
        <div className="text-7xl sm:text-8xl font-bold text-violet-900">{item.content_jp}</div>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {choices.map((c) => {
          const isCorrect = c === correctVal;
          const showCorrect = picked && isCorrect;
          const showWrong = picked === c && !isCorrect;
          return (
            <button
              key={c}
              onClick={() => choose(c)}
              disabled={!!picked}
              className={cn(
                "px-4 py-5 rounded-2xl border-2 text-lg font-semibold transition-all",
                !picked && "border-violet-200 bg-white text-violet-900 hover:bg-violet-50",
                showCorrect && "border-lime-500 bg-lime-50 text-lime-700",
                showWrong && "border-red-400 bg-red-50 text-red-700",
                picked && !isCorrect && !showWrong && "opacity-50 border-violet-100"
              )}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DoneScreen({
  title,
  mastered,
  xp,
  nextSessionId,
  onRetry,
}: {
  title: string;
  mastered: number;
  xp: number;
  nextSessionId: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
      <div className="h-24 w-24 rounded-full bg-lime-500 grid place-items-center shadow-lg">
        <Check className="h-12 w-12 text-white" strokeWidth={3} />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-violet-900">Sesi selesai</h1>
        <p className="mt-1 text-violet-900/70">{title}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full">
        <Stat label="Dikuasai" value={mastered} />
        <Stat label="XP" value={`+${xp}`} accent />
        <Stat label="Streak" value="🔥 1" />
      </div>
      <div className="flex flex-col gap-2 w-full pt-2">
        {nextSessionId ? (
          <Link
            to="/belajar/$sessionId"
            params={{ sessionId: nextSessionId }}
            className="px-5 py-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-violet-900 font-bold inline-flex items-center justify-center gap-2"
          >
            Lanjut ke sesi berikutnya <ArrowRight className="h-5 w-5" />
          </Link>
        ) : (
          <Link
            to="/dashboard"
            className="px-5 py-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-violet-900 font-bold inline-flex items-center justify-center gap-2"
          >
            <Trophy className="h-5 w-5" /> Selesaikan unit
          </Link>
        )}
        <button
          onClick={onRetry}
          className="px-5 py-3 rounded-xl border border-violet-200 text-violet-900 font-semibold inline-flex items-center justify-center gap-2"
        >
          <RotateCw className="h-4 w-4" /> Ulangi sesi ini
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl border p-4",
      accent ? "border-lime-300 bg-lime-50" : "border-violet-100 bg-violet-50"
    )}>
      <div className={cn("text-2xl font-bold", accent ? "text-lime-700" : "text-violet-900")}>
        {value}
      </div>
      <div className="text-xs text-violet-900/60 uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}
