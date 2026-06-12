import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flame, X } from "lucide-react";
import { getHistory, getStreakDays } from "@/lib/storage";
import { useLang } from "@/lib/i18n";

const DISMISS_KEY = "nihongo:streak-reminder-dismissed";

function searchedToday(): boolean {
  const today = new Date().toDateString();
  return getHistory().some((h) => new Date(h.date).toDateString() === today);
}

/**
 * Shows once per day when the user has a streak (>=1) but hasn't logged
 * activity yet today. Encourages them to do a quick translate to keep
 * the streak alive. Pure client, no server infra.
 */
export function StreakReminder() {
  const lang = useLang();
  const [show, setShow] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const today = new Date().toDateString();
      const dismissed = window.localStorage.getItem(DISMISS_KEY);
      if (dismissed === today) return;
      const s = getStreakDays();
      if (s < 1) return;
      if (searchedToday()) return;
      setStreak(s);
      setShow(true);
    } catch {
      // ignore
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, new Date().toDateString());
    } catch {
      /* ignore */
    }
  };

  const isId = lang === "id";

  return (
    <div className="fixed bottom-20 left-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-orange-300/60 bg-orange-50 dark:bg-orange-950/60 dark:border-orange-700/60 p-3 shadow-lg backdrop-blur">
      <button
        onClick={dismiss}
        aria-label={isId ? "Tutup" : "Close"}
        className="absolute right-2 top-2 rounded-md p-1 text-orange-700/70 hover:bg-orange-100 dark:text-orange-300/70 dark:hover:bg-orange-900"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-3 pr-5">
        <Flame className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
            {isId
              ? `Streak ${streak} hari 🔥 — jangan putus!`
              : `${streak}-day streak 🔥 — keep it going!`}
          </p>
          <p className="mt-0.5 text-xs text-orange-800/80 dark:text-orange-200/80">
            {isId
              ? "Cari 1 ekspresi hari ini untuk pertahankan streak."
              : "Search one expression today to keep your streak alive."}
          </p>
          <Link
            to="/translate"
            onClick={dismiss}
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white hover:bg-orange-600"
          >
            {isId ? "Cari sekarang" : "Search now"}
          </Link>
        </div>
      </div>
    </div>
  );
}
