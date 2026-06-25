import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X, Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  DoneScreen,
  ListenStage,
  QuizStage,
  shuffle,
  type LearnItem,
} from "@/components/learn-stages";
import { getDueReviews, reviewItem } from "@/lib/review.functions";

export const Route = createFileRoute("/belajar/review")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Latihan ulang — Nihongolive" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewPage,
});

type Phase = "listen" | "quiz" | "done";

function ReviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fetchDue = useServerFn(getDueReviews);

  const { data, isLoading } = useQuery({
    queryKey: ["due-reviews", user?.id],
    queryFn: () => fetchDue(),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <p className="mb-4 text-violet-900">Masuk dulu untuk memulai latihan ulang.</p>
          <Link to="/auth" className="text-violet-700 underline">
            Masuk
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center text-violet-900">Memuat…</div>;
  }

  const items: LearnItem[] =
    (data ?? []).map((d) => ({
      id: d.item_id,
      content_jp: d.content_jp,
      content_romaji: d.content_romaji,
      content_meaning: d.content_meaning,
    })) ?? [];

  if (items.length === 0) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <p className="mb-4 text-violet-900 text-lg">Tidak ada item yang perlu diulang hari ini 🎉</p>
          <Link to="/dashboard" className="text-violet-700 underline">
            Kembali ke dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <ReviewRunner items={items} onClose={() => navigate({ to: "/dashboard" })} />;
}

function ReviewRunner({ items, onClose }: { items: LearnItem[]; onClose: () => void }) {
  const review = useServerFn(reviewItem);
  const [phase, setPhase] = useState<Phase>("listen");
  const [lives, setLives] = useState(5);
  const [correctIds, setCorrectIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState(0);

  const listenItems = useMemo(() => shuffle(items), [items]);
  const quizItems = useMemo(() => shuffle(items), [items]);
  const total = listenItems.length + quizItems.length;
  const progressPct = Math.round((step / Math.max(1, total)) * 100);

  const recordAnswer = useCallback(
    (item: LearnItem, correct: boolean) => {
      if (correct) setCorrectIds((s) => new Set(s).add(item.id));
      else setLives((l) => Math.max(0, l - 1));
      setStep((s) => s + 1);
      review({ data: { itemId: item.id, response: correct ? "good" : "again" } }).catch((e) => {
        console.error("reviewItem failed", e);
      });
    },
    [review],
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center gap-4 px-4 sm:px-6 py-4 border-b border-violet-100">
        <button
          onClick={onClose}
          aria-label="Tutup latihan"
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
            title="Latihan selesai"
            subtitle={`${items.length} item diulang`}
            mastered={correctIds.size}
            xp={correctIds.size * 5}
            primaryHref="/dashboard"
            primaryLabel="Kembali ke dashboard"
            onRetry={() => window.location.reload()}
          />
        )}
      </main>
    </div>
  );
}
