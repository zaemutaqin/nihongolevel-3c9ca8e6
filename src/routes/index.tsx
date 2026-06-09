import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { Loader2, ChevronDown, AlertCircle, Sparkles, Zap } from "lucide-react";
import {
  styleBlockToLevelBlock,
  type TranslationResult,
  type IntentInfo,
  type SocialAnalysis,
  type MostNatural,
  type AlternativeExpression,
  type LevelBlock,
  type RawStyleBlock,
} from "@/lib/translate.functions";
import { useT } from "@/lib/i18n";
import { gtagEvent } from "@/lib/gtag";
import { useAuth } from "@/lib/auth";


type TranslateErrorCode =
  | "FORBIDDEN_ORIGIN"
  | "RATE_LIMITED"
  | "CREDITS_EXHAUSTED"
  | "AI_UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "SERVER_MISCONFIGURED";

const ERR_CODES: TranslateErrorCode[] = [
  "FORBIDDEN_ORIGIN",
  "RATE_LIMITED",
  "CREDITS_EXHAUSTED",
  "AI_UNAVAILABLE",
  "INVALID_RESPONSE",
  "SERVER_MISCONFIGURED",
];

import { cn } from "@/lib/utils";
import {
  IntentBadge,
  SocialAnalysisCard,
  LevelCard,
  MostNaturalCard,
  AlternativesSection,
} from "@/components/result-parts";
import {
  IntentBadgeSkeleton,
  MostNaturalSkeleton,
  StyleCardSkeleton,
} from "@/components/result-skeletons";
import {
  addHistory,
  addFavoriteFromLevel,
  addFavoriteFromMostNatural,
  isFavorited,
  buildCacheKey,
  getCachedResult,
  setCachedResult,
  type HistoryEntry,
  type LevelKey,
} from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NihongoLevel — Belajar Bicara Bahasa Jepang Natural" },
      {
        name: "description",
        content:
          "Cari ekspresi bahasa Jepang paling natural untuk setiap situasi sehari-hari — lengkap dengan level kesopanan (N1–N4) dan analisis konteks sosial.",
      },
      { property: "og:title", content: "NihongoLevel — Belajar Bicara Bahasa Jepang Natural" },
      {
        property: "og:description",
        content:
          "Cari ekspresi bahasa Jepang paling natural untuk setiap situasi, dengan level kesopanan dan konteks sosial.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [
      { rel: "canonical", href: "/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),

  component: Index,
});


const LEVELS: { key: LevelKey; label: string }[] = [
  { key: "n4", label: "N4" },
  { key: "n3", label: "N3" },
  { key: "n2", label: "N2" },
  { key: "n1", label: "N1" },
];

const GUEST_LIMIT = 3;

function Index() {
  const { t, tList, lang } = useT();
  const { profile } = useAuth();
  const isPro = !!profile?.is_pro;

  const friendlyError = (e: unknown): string => {
    const raw = e instanceof Error ? e.message : String(e);
    const base =
      e instanceof Error && (ERR_CODES as string[]).includes(e.message)
        ? t(`err.${e.message}`)
        : t("err.generic");
    if (import.meta.env.DEV) return `${base} [${raw}]`;
    return base;
  };
  const friendlyError = (e: unknown): string => {
    const raw = e instanceof Error ? e.message : String(e);
    const base =
      e instanceof Error && (ERR_CODES as string[]).includes(e.message)
        ? t(`err.${e.message}`)
        : t("err.generic");
    // Show technical code in dev/preview so we can actually debug
    if (import.meta.env.DEV) return `${base} [${raw}]`;
    return base;
  };
  const EXAMPLES = tList("examples");
  const LISTENER_OPTIONS = [
    { value: "", label: t("opt.listener.unknown") },
    { value: t("opt.listener.self"), label: t("opt.listener.self") },
    { value: t("opt.listener.friend"), label: t("opt.listener.friend") },
    { value: t("opt.listener.colleague"), label: t("opt.listener.colleague") },
    { value: t("opt.listener.senior"), label: t("opt.listener.senior") },
    { value: t("opt.listener.client"), label: t("opt.listener.client") },
    { value: t("opt.listener.younger"), label: t("opt.listener.younger") },
  ];
  const MOOD_OPTIONS = [
    { value: "", label: t("opt.mood.normal") },
    { value: t("opt.mood.casual"), label: t("opt.mood.casual") },
    { value: t("opt.mood.serious"), label: t("opt.mood.serious") },
    { value: t("opt.mood.upset"), label: t("opt.mood.upset") },
    { value: t("opt.mood.happy"), label: t("opt.mood.happy") },
    { value: t("opt.mood.awkward"), label: t("opt.mood.awkward") },
  ];

  const [input, setInput] = useState("");
  const [listener, setListener] = useState("");
  const [mood, setMood] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [historyEntry, setHistoryEntry] = useState<HistoryEntry | null>(null);
  const [favTick, setFavTick] = useState(0);
  const [open, setOpen] = useState<Record<LevelKey, boolean>>({
    n4: false,
    n3: false,
    n2: false,
    n1: false,
  });

  // Progressive (partial) result fields populated while the AI is streaming.
  const [partialIntent, setPartialIntent] = useState<IntentInfo | null>(null);
  const [partialSocial, setPartialSocial] = useState<SocialAnalysis | null>(null);
  const [partialMostNatural, setPartialMostNatural] = useState<MostNatural | null>(null);
  const [partialAlts, setPartialAlts] = useState<AlternativeExpression[]>([]);
  const [partialLevels, setPartialLevels] = useState<Partial<Record<LevelKey, LevelBlock>>>({});
  const abortRef = useRef<AbortController | null>(null);

  const STYLE_TO_LEVEL_KEY: Record<string, LevelKey> = {
    dasar: "n4",
    sehari_hari: "n3",
    ekspresif: "n2",
    mendekati_native: "n1",
  };

  // Pick up prefill written by Dashboard suggestion chips
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pre = sessionStorage.getItem("nihongo_prefill");
    if (pre) {
      sessionStorage.removeItem("nihongo_prefill");
      setInput(pre);
    }
  }, []);

  const resetPartial = () => {
    setPartialIntent(null);
    setPartialSocial(null);
    setPartialMostNatural(null);
    setPartialAlts([]);
    setPartialLevels({});
  };

  const finalize = (sentence: string, full: TranslationResult, cached: boolean) => {
    setResult(full);
    const entry = addHistory(sentence, full);
    setHistoryEntry(entry);
    setOpen({ n4: false, n3: false, n2: false, n1: false });
    if (!cached) {
      setCachedResult(buildCacheKey(sentence, listener, mood), full);
    }
  };

  const handleTranslate = async (text?: string) => {
    if (!isPro && guestCount >= GUEST_LIMIT) return;
    const sentence = (text ?? input).trim();
    if (!sentence) {
      setError(t("home.errEmpty"));
      return;
    }
    gtagEvent("search", { search_term: sentence });
    if (!isPro) {
      const n = guestCount + 1;
      localStorage.setItem("nihongo_guest_count", String(n));
      setGuestCount(n);
    }
    setError(null);
    setResult(null);
    setHistoryEntry(null);
    resetPartial();

    // 1) Cache hit → instant render
    const ckey = buildCacheKey(sentence, listener, mood);
    const cached = getCachedResult(ckey);
    if (cached) {
      setFromCache(true);
      setLoading(false);
      finalize(sentence, cached, true);
      return;
    }
    setFromCache(false);
    setLoading(true);

    // 2) Stream from the server route — with one automatic retry on failure
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const NON_RETRYABLE = new Set([
      "FORBIDDEN_ORIGIN",
      "RATE_LIMITED",
      "CREDITS_EXHAUSTED",
      "SERVER_MISCONFIGURED",
    ]);

    const attempt = async (): Promise<TranslationResult> => {
      resetPartial();
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence,
          listener: listener || undefined,
          mood: mood || undefined,
          lang,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        let code = "AI_UNAVAILABLE";
        try {
          const j = await res.json();
          if (j?.error) code = j.error;
        } catch {
          /* noop */
        }
        throw new Error(code);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let finalFull: TranslationResult | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          let ev: { type: string; [k: string]: unknown };
          try {
            ev = JSON.parse(line);
          } catch {
            continue;
          }
          if (ev.type === "section") {
            const k = ev.key as string;
            if (k === "intent") setPartialIntent(ev.value as IntentInfo);
            else if (k === "social_analysis") setPartialSocial(ev.value as SocialAnalysis);
            else if (k === "most_natural") setPartialMostNatural(ev.value as MostNatural);
            else if (k === "alternatives")
              setPartialAlts((ev.value as AlternativeExpression[]) ?? []);
          } else if (ev.type === "style") {
            const sk = ev.styleKey as string;
            const lk = STYLE_TO_LEVEL_KEY[sk];
            if (lk) {
              const block = styleBlockToLevelBlock(ev.value as RawStyleBlock);
              setPartialLevels((prev) => ({ ...prev, [lk]: block }));
            }
          } else if (ev.type === "done") {
            const raw = ev.full as {
              intent: IntentInfo;
              social_analysis: SocialAnalysis;
              most_natural: MostNatural;
              alternatives?: (AlternativeExpression & { style?: string })[];
              styles?: Record<string, RawStyleBlock>;
            };
            const styles = raw.styles ?? {};
            const styleToLvl: Record<string, "N4" | "N3" | "N2" | "N1"> = {
              dasar: "N4",
              sehari_hari: "N3",
              ekspresif: "N2",
              mendekati_native: "N1",
            };
            const alts: AlternativeExpression[] = (raw.alternatives ?? []).map((a, i) => ({
              rank: a.rank ?? i + 1,
              role_label: a.role_label,
              context_label: a.context_label,
              japanese: a.japanese,
              romaji: a.romaji,
              explanation: a.explanation,
              level: a.style ? styleToLvl[a.style] ?? "N3" : a.level ?? "N3",
            }));
            finalFull = {
              intent: raw.intent,
              social_analysis: raw.social_analysis,
              most_natural: {
                ...raw.most_natural,
                level: raw.most_natural?.level ?? "N3",
              },
              alternatives: alts,
              n4: styleBlockToLevelBlock(styles.dasar),
              n3: styleBlockToLevelBlock(styles.sehari_hari),
              n2: styleBlockToLevelBlock(styles.ekspresif),
              n1: styleBlockToLevelBlock(styles.mendekati_native),
            };
          } else if (ev.type === "error") {
            throw new Error((ev.code as string) || "AI_UNAVAILABLE");
          }
        }
      }

      if (!finalFull) throw new Error("INVALID_RESPONSE");
      return finalFull;
    };

    try {
      let finalFull: TranslationResult;
      try {
        finalFull = await attempt();
      } catch (e) {
        if ((e as Error)?.name === "AbortError") throw e;
        const code = (e as Error)?.message;
        if (NON_RETRYABLE.has(code)) throw e;
        console.warn("[translate] first attempt failed, retrying once:", code);
        finalFull = await attempt();
      }
      finalize(sentence, finalFull, false);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      console.error(e);
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleTranslate();
    }
  };

  const useExample = (ex: string) => {
    setInput(ex);
    handleTranslate(ex);
  };

  const favMostNatural = historyEntry
    ? isFavorited(historyEntry.id, "most_natural")
    : false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 mb-3 px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground text-[10px] font-medium">
          <Sparkles className="w-3 h-3" />
          {t("misc.poweredBy")}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          NihongoLevel — Belajar Bicara Bahasa Jepang Natural
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">{t("home.subtitle")}</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <label htmlFor="input" className="block text-sm font-medium mb-2">
          {t("home.inputLabel")}
        </label>
        <textarea
          id="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("home.placeholder")}
          rows={3}
          disabled={guestBlocked}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        {!isPro && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <span className={cn("w-1.5 h-1.5 rounded-full", remaining > 0 ? "bg-primary" : "bg-destructive")} />
              {lang === "id"
                ? `Sisa pencarian hari ini: ${remaining}/${GUEST_LIMIT}`
                : `Searches remaining today: ${remaining}/${GUEST_LIMIT}`}
            </span>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setContextOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/40 transition"
            aria-expanded={contextOpen}
          >
            <span>{t("home.addContext")}</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                contextOpen && "rotate-180",
              )}
            />
          </button>
          {contextOpen && (
            <div className="px-3 pb-3 grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                  {t("home.listenerLabel")}
                </label>
                <select
                  value={listener}
                  onChange={(e) => setListener(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                >
                  {LISTENER_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                  {t("home.moodLabel")}
                </label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                >
                  {MOOD_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {t("home.shortcut")} <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground/80">Ctrl</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground/80">Enter</kbd>
          </p>
          <button
            onClick={() => handleTranslate()}
            disabled={loading || guestBlocked}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("home.searching")}
              </>
            ) : (
              t("home.searchBtn")
            )}
          </button>
        </div>

        <div className="mt-5">
          <p className="text-xs text-muted-foreground mb-2">{t("home.examplesLabel")}</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => useExample(ex)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {loading && !result && (
        <div className="mt-8 space-y-6">
          <h2 className="text-base font-bold text-foreground">
            {t("home.resultHeader")}
          </h2>
          {partialIntent ? <IntentBadge intent={partialIntent} /> : <IntentBadgeSkeleton />}
          {partialSocial && <SocialAnalysisCard data={partialSocial} />}
          {partialMostNatural ? (
            <MostNaturalCard
              data={{ ...partialMostNatural, level: partialMostNatural.level ?? "N3" }}
              isFav={false}
              onFavorite={() => {}}
            />
          ) : (
            <MostNaturalSkeleton />
          )}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground/80">
              {t("home.styleSubheader")}
            </h3>
            <div className="space-y-4">
              {LEVELS.map(({ key, label }) =>
                partialLevels[key] ? (
                  <LevelCard
                    key={key}
                    level={label}
                    data={partialLevels[key]!}
                    open={false}
                    onToggle={() => {}}
                    isFav={false}
                    onFavorite={() => {}}
                  />
                ) : (
                  <StyleCardSkeleton key={key} label={label} />
                ),
              )}
            </div>
          </section>
        </div>
      )}

      {result && historyEntry && (
        <div className="mt-8 space-y-6" key={favTick}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">
              {t("home.resultHeader")}
            </h2>
            {fromCache && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <Zap className="w-3 h-3" />
                {t("home.fromCache")}
              </span>
            )}
          </div>
          <IntentBadge intent={result.intent} />
          {result.social_analysis && <SocialAnalysisCard data={result.social_analysis} />}
          <MostNaturalCard
            data={result.most_natural}
            isFav={favMostNatural}
            onFavorite={() => {
              addFavoriteFromMostNatural(historyEntry);
              setFavTick((t) => t + 1);
              gtagEvent("save_favorite");
            }}
          />
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground/80">
              {t("home.styleSubheader")}
            </h3>
            <div className="space-y-4">
              {LEVELS.map(({ key, label }) => (
                <LevelCard
                  key={key}
                  level={label}
                  data={result[key]}
                  open={open[key]}
                  onToggle={() => setOpen((s) => ({ ...s, [key]: !s[key] }))}
                  isFav={isFavorited(historyEntry.id, "level", label)}
                  onFavorite={() => {
                    addFavoriteFromLevel(historyEntry, key);
                    setFavTick((t) => t + 1);
                    gtagEvent("save_favorite");
                  }}
                />
              ))}
            </div>
          </section>
          {result.alternatives?.length > 0 && (
            <AlternativesSection items={result.alternatives} />
          )}
        </div>
      )}

      <footer className="mt-16 pb-6 text-center text-xs text-muted-foreground">
        {t("home.footer")}
      </footer>
      {guestBlocked && <GuestPrompt />}
    </div>
  );
}
