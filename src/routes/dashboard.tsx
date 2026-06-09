import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Star, ArrowRight, RotateCw, X } from "lucide-react";
import {
  getHistory,
  getFavorites,
  getStreakDays,
  getSearchesThisWeek,
  getIntentCounts,
  getFavoritesNeedsReview7d,
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

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Perjalanan Belajarmu — NihongoLevel" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useT();
  const [history] = useLocalCollection<HistoryEntry>(getHistory);
  const [favs] = useLocalCollection<FavoriteEntry>(getFavorites);
  const [needsReview] = useLocalCollection<FavoriteEntry>(getFavoritesNeedsReview7d);
  const [oldest] = useLocalCollection(getOldestReviewedFavorites);
  const navigate = useNavigate();

  const streak = useMemo(() => getStreakDays(), [history]);
  const week = useMemo(() => getSearchesThisWeek(), [history]);
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
    navigate({ to: "/" });
  };


  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Perjalanan Belajarmu</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Pantau kemajuan dan latihan ekspresi favoritmu setiap hari.
      </p>

      {/* SECTION A — Today */}
      <Section title="Hari ini">
        <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Perlu diulang hari ini
              </p>
              <p className="text-2xl font-bold mt-0.5">
                {needsReview.length}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ekspresi
                </span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-300/50">
              <Flame className="w-3.5 h-3.5" /> {streak} hari berturut-turut
            </span>
          </div>

          {needsReview.length === 0 ? (
            <p className="text-sm text-foreground/80">
              Semua ekspresi sudah diulang. Bagus! 🎉
            </p>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-background/70 p-4 mt-1">
                <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-1">
                  Mulai dari ini
                </p>
                <div className="flex items-start gap-2">
                  <p className="font-jp text-2xl leading-snug flex-1 break-words">
                    {cleanJapanese(needsReview[0].japanese)}
                  </p>
                  <SpeakerButton text={cleanJapanese(needsReview[0].japanese)} size="sm" />
                </div>
                <p className="mt-1 italic text-sm text-muted-foreground">
                  {needsReview[0].romaji}
                </p>
              </div>
              <Link
                to="/review"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                Mulai Latihan <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </Section>

      {/* SECTION B — Untried situations */}
      <Section title="Situasi yang belum kamu coba">
        {untried.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Hebat! Kamu sudah pernah mencoba semua situasi. Coba variasi lain di halaman Cari.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
              Ketuk salah satu untuk mencobanya.
            </p>
            <div className="grid gap-2">
              {untried.map((t) => {
                const meta = INTENT_LABELS[t];
                return (
                  <button
                    key={t}
                    onClick={() => handleSuggest(SUGGESTIONS[t])}
                    className="text-left rounded-xl border border-border bg-background hover:bg-muted/50 hover:border-primary/40 transition px-4 py-3 group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-white px-2 py-0.5 rounded-full mb-1.5"
                          style={{ backgroundColor: `var(--intent-${t})` }}
                        >
                          {meta.emoji} {meta.short}
                        </span>
                        <p className="text-sm text-foreground truncate">
                          "{SUGGESTIONS[t]}"
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      {/* SECTION C — Patterns */}
      <Section title="Pola belajarmu">
        <div className="grid sm:grid-cols-2 gap-3">
          <PatternCard title="Situasi paling sering">
            {intentCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              <ul className="space-y-2">
                {intentCounts.slice(0, 3).map(({ type, count }) => {
                  const meta = INTENT_LABELS[type];
                  return (
                    <li key={type} className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-white px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `var(--intent-${type})` }}
                      >
                        {meta.emoji} {meta.short}
                      </span>
                      <span className="text-sm font-bold">{count}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </PatternCard>

          <PatternCard title="Gaya bicara favoritmu">
            {topStyle ? (
              <div>
                <StylePill level={topStyle[0]} />
                <p className="mt-2 text-xs text-muted-foreground">
                  Muncul {topStyle[1]}× di favoritmu —{" "}
                  <JlptRef level={topStyle[0]} />
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Simpan favorit untuk melihat gaya bicara yang paling kamu sukai.
              </p>
            )}
          </PatternCard>

          <PatternCard title="Total kalimat dipelajari">
            <p className="text-3xl font-bold">{history.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">sepanjang waktu</p>
          </PatternCard>

          <PatternCard title="Minggu ini">
            <p className="text-3xl font-bold">{week}</p>
            <p className="text-xs text-muted-foreground mt-0.5">pencarian dalam 7 hari</p>
          </PatternCard>
        </div>
      </Section>

      {/* SECTION D — Almost forgotten */}
      <Section title="Ekspresi yang hampir terlupakan">
        {oldest.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada favorit. Simpan dulu beberapa ekspresi untuk diulang nanti.
          </p>
        ) : (
          <div className="grid gap-3">
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
                    Terakhir dilihat {daysAgo(lastReviewed)}
                  </span>
                  <button
                    onClick={() => setModalFav(fav)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Ulang sekarang
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
                className="rounded-lg border border-green-500/40 bg-green-500/10 text-green-700 py-2.5 text-sm font-semibold hover:bg-green-500/15 transition"
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
