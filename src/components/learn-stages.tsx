import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Volume2, Check, ArrowRight, RotateCw, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { speakJapanese } from "@/lib/tts";

export type LearnItem = {
  id: string;
  type?: string;
  content_jp: string;
  content_romaji: string | null;
  content_meaning: string | null;
};

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function speak(text: string) {
  speakJapanese(text, { rate: 0.9 });
}


export function pickChoices(
  items: LearnItem[],
  correct: LearnItem,
  field: "content_romaji" | "content_meaning" | "content_jp",
): string[] {
  const others = items.filter((i) => i.id !== correct.id && i[field]);
  const pool = shuffle(others).slice(0, 3).map((i) => i[field] as string);
  const correctVal = (correct[field] as string) || correct.content_jp;
  return shuffle([correctVal, ...pool.filter((v) => v !== correctVal)]).slice(0, 4);
}

export function ListenStage({
  allItems,
  queue,
  onAnswer,
  onDone,
}: {
  allItems: LearnItem[];
  queue: LearnItem[];
  onAnswer: (item: LearnItem, correct: boolean) => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const item = queue[i];
  const choices = useMemo(() => pickChoices(allItems, item, "content_jp"), [allItems, item]);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    setPicked(null);
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
                picked && !isCorrect && !showWrong && "opacity-50 border-violet-100",
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

export function QuizStage({
  allItems,
  queue,
  onAnswer,
  onDone,
}: {
  allItems: LearnItem[];
  queue: LearnItem[];
  onAnswer: (item: LearnItem, correct: boolean) => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const item = queue[i];
  const field: "content_romaji" | "content_meaning" = item.content_romaji
    ? "content_romaji"
    : "content_meaning";
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
                picked && !isCorrect && !showWrong && "opacity-50 border-violet-100",
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

export function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        accent ? "border-lime-300 bg-lime-50" : "border-violet-100 bg-violet-50",
      )}
    >
      <div className={cn("text-2xl font-bold", accent ? "text-lime-700" : "text-violet-900")}>
        {value}
      </div>
      <div className="text-xs text-violet-900/60 uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

export function DoneScreen({
  title,
  subtitle,
  mastered,
  xp,
  primaryHref,
  primaryParams,
  primaryLabel,
  onRetry,
}: {
  title: string;
  subtitle?: string;
  mastered: number;
  xp: number;
  primaryHref: string;
  primaryParams?: Record<string, string>;
  primaryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
      <div className="h-24 w-24 rounded-full bg-lime-500 grid place-items-center shadow-lg">
        <Check className="h-12 w-12 text-white" strokeWidth={3} />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-violet-900">{title}</h1>
        {subtitle && <p className="mt-1 text-violet-900/70">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-3 gap-3 w-full">
        <Stat label="Dikuasai" value={mastered} />
        <Stat label="XP" value={`+${xp}`} accent />
        <Stat label="Streak" value="🔥 1" />
      </div>
      <div className="flex flex-col gap-2 w-full pt-2">
        <Link
          to={primaryHref as never}
          params={primaryParams as never}
          className="px-5 py-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-violet-900 font-bold inline-flex items-center justify-center gap-2"
        >
          {primaryParams ? <ArrowRight className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
          {primaryLabel}
        </Link>
        <button
          onClick={onRetry}
          className="px-5 py-3 rounded-xl border border-violet-200 text-violet-900 font-semibold inline-flex items-center justify-center gap-2"
        >
          <RotateCw className="h-4 w-4" /> Ulangi
        </button>
      </div>
    </div>
  );
}
