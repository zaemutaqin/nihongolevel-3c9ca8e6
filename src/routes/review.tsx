import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, X, RotateCw } from "lucide-react";
import {
  getDueReviewFavorites,
  rateReview,
  useLocalCollection,
  type FavoriteEntry,
} from "@/lib/storage";
import { StylePill, JlptRef, cleanJapanese } from "@/components/result-parts";
import { SpeakerButton } from "@/components/SpeakerButton";

export const Route = createFileRoute("/review")({
  head: () => ({ meta: [{ title: "Review — NihongoLevel" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const [due] = useLocalCollection<FavoriteEntry>(getDueReviewFavorites);
  const [session, setSession] = useState<FavoriteEntry[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (session === null && due.length > 0) {
      setSession(due);
    }
  }, [due, session]);

  const total = session?.length ?? due.length;
  const current = session?.[idx];

  const dueCount = useMemo(() => due.length, [due]);

  if (total === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-3">Review</h1>
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="font-semibold">Belum ada yang perlu direview hari ini</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Simpan ekspresi sebagai favorit untuk mulai mengulangnya di sini.
          </p>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-3">Review</h1>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-semibold text-lg">Sesi selesai!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kamu sudah meninjau {total} ekspresi hari ini.
          </p>
          <button
            onClick={() => {
              setSession(null);
              setIdx(0);
              setRevealed(false);
            }}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            <RotateCw className="w-4 h-4" /> Mulai sesi baru
          </button>
        </div>
      </div>
    );
  }

  const handleRate = (correct: boolean) => {
    rateReview(current.id, correct);
    setRevealed(false);
    setIdx((i) => i + 1);
  };

  const progress = ((idx) / total) * 100;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5">
        <p className="text-sm text-muted-foreground mb-1">
          {dueCount} ekspresi siap direview hari ini
        </p>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {idx + 1} / {total}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
          Coba ingat dalam Bahasa Jepang
        </p>
        <p className="text-xl sm:text-2xl font-semibold text-foreground">{current.input}</p>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="mt-6 w-full rounded-lg bg-primary text-primary-foreground px-5 py-3 text-sm font-medium hover:opacity-90 transition"
          >
            Lihat jawaban
          </button>
        ) : (
          <>
            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-start gap-2">
                <p className="font-jp text-3xl sm:text-4xl leading-snug text-foreground flex-1">
                  {current.japanese}
                </p>
                <SpeakerButton text={current.japanese} />
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
                <X className="w-4 h-4" /> Lupa
              </button>
              <button
                onClick={() => handleRate(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 text-green-700 px-5 py-3 text-sm font-semibold hover:bg-green-500/15 transition"
              >
                <Check className="w-4 h-4" /> Ingat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
