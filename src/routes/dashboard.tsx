import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  getHistory,
  getFavorites,
  getStreakDays,
  getSearchesThisWeek,
  getIntentCounts,
  getLevelDistribution,
  useLocalCollection,
  formatIndonesianDate,
  type HistoryEntry,
  type FavoriteEntry,
} from "@/lib/storage";
import { INTENT_LABELS } from "@/components/result-parts";
import type { IntentType } from "@/lib/translate.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NihongoLevel" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [history] = useLocalCollection<HistoryEntry>(getHistory);
  const [favs] = useLocalCollection<FavoriteEntry>(getFavorites);

  const stats = useMemo(
    () => ({
      total: history.length,
      week: getSearchesThisWeek(),
      favs: favs.length,
      streak: getStreakDays(),
    }),
    [history, favs],
  );

  const intentCounts = useMemo(() => getIntentCounts(), [history]);
  const levelDist = useMemo(() => getLevelDistribution(), [history]);
  const maxIntent = Math.max(1, ...intentCounts.map((i) => i.count));
  const maxLevel = Math.max(1, ...Object.values(levelDist));
  const recent = history.slice(0, 10);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const needsReview = favs.filter((f) => new Date(f.added_at).getTime() < sevenDaysAgo);

  const triedIntents = new Set(history.map((h) => h.intent.type));
  const allIntents = Object.keys(INTENT_LABELS) as IntentType[];
  const untried = allIntents.filter((t) => !triedIntents.has(t));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-5">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Metric label="Total pencarian" value={stats.total} />
        <Metric label="Minggu ini" value={stats.week} />
        <Metric label="Total favorit" value={stats.favs} />
        <Metric label="Streak (hari)" value={stats.streak} />
      </div>

      <Section title="Situasi yang paling sering muncul">
        {intentCounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada data.</p>
        ) : (
          <ul className="space-y-2">
            {intentCounts.slice(0, 5).map(({ type, count }) => {
              const meta = INTENT_LABELS[type];
              const pct = (count / maxIntent) * 100;
              return (
                <li key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      {meta.emoji} {meta.label}
                    </span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: `var(--intent-${type})` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Level yang paling sering dipelajari">
        <ul className="space-y-2">
          {(["N4", "N3", "N2", "N1"] as const).map((lvl) => {
            const count = levelDist[lvl] ?? 0;
            const pct = (count / maxLevel) * 100;
            return (
              <li key={lvl}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">{lvl}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: `var(--level-${lvl.toLowerCase()})`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="10 kalimat terakhir yang dipelajari">
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kalimat.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((h) => (
              <li key={h.id} className="py-2.5">
                <p className="text-sm font-medium text-foreground">{h.input}</p>
                <p className="font-jp text-sm text-muted-foreground mt-0.5">
                  {h.most_natural.japanese}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatIndonesianDate(h.date)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Perlu diulang">
        {needsReview.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tidak ada favorit yang perlu diulang sekarang.
          </p>
        ) : (
          <ul className="space-y-2">
            {needsReview.slice(0, 5).map((f) => (
              <li key={f.id} className="rounded-lg border border-border p-3">
                <p className="font-jp text-base">{f.japanese}</p>
                <p className="text-xs text-muted-foreground italic">{f.romaji}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Situasi yang belum pernah kamu coba">
        {untried.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Hebat! Kamu sudah pernah mencoba semua situasi.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {untried.map((t) => {
              const meta = INTENT_LABELS[t];
              return (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: `var(--intent-${t})` }}
                >
                  {meta.emoji} {meta.label}
                </span>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground/80">
        {title}
      </h2>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">{children}</div>
    </section>
  );
}
