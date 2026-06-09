import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import {
  getFavorites,
  removeFavorite,
  useLocalCollection,
  type FavoriteEntry,
} from "@/lib/storage";
import { NaturalnessBar, StylePill, JlptRef, KanjiCard, cleanJapanese, useIntentLabel } from "@/components/result-parts";
import { SpeakerButton } from "@/components/SpeakerButton";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { IntentType } from "@/lib/translate.functions";
import { useAuth } from "@/lib/auth";
import { LockedFeature } from "@/components/LockedFeature";

export const Route = createFileRoute("/favorit")({
  head: () => ({
    meta: [
      { title: "Favorit — NihongoLevel" },
      {
        name: "description",
        content:
          "Kumpulan ekspresi bahasa Jepang yang kamu tandai favorit — siap diulang kapan saja untuk memperkuat ingatan.",
      },
      { property: "og:title", content: "Favorit — NihongoLevel" },
      { property: "og:description", content: "Ekspresi bahasa Jepang favorit kamu, siap diulang kapan saja." },
      { property: "og:url", content: "/favorit" },
    ],
    links: [{ rel: "canonical", href: "/favorit" }],
  }),

  component: FavoritPage,
});

function FavoritPage() {
  const { t } = useT();
  const { profile } = useAuth();
  const [favs] = useLocalCollection<FavoriteEntry>(getFavorites);
  const [filter, setFilter] = useState<IntentType | "all">("all");

  if (!profile?.is_pro) return <LockedFeature />;

  const FILTERS: { value: IntentType | "all"; label: string }[] = [
    { value: "all", label: t("fav.filter.all") },
    { value: "monolog", label: t("intent.monolog_short") },
    { value: "asking_others", label: t("intent.asking_others_short") },
    { value: "casual_conversation", label: t("intent.casual_conversation_short") },
    { value: "professional_formal", label: t("intent.professional_formal_short") },
    { value: "joking_relaxed", label: t("intent.joking_relaxed_short") },
  ];

  const filtered = useMemo(
    () => (filter === "all" ? favs : favs.filter((f) => f.intent.type === filter)),
    [favs, filter],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{t("fav.title")}</h1>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition",
              filter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="font-semibold">{t("fav.empty.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("fav.empty.desc")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((f) => (
            <FavoriteCard key={f.id} fav={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function FavoriteCard({ fav }: { fav: FavoriteEntry }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const tone = `level-${(fav.level || "N3").toLowerCase()}`;
  const intentMeta = useIntentLabel(fav.intent.type);
  return (
    <div
      className="rounded-2xl border bg-card shadow-sm p-5"
      style={{ borderColor: `var(--${tone})` + "40" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="font-jp text-2xl sm:text-3xl leading-snug text-foreground flex-1 break-words">
              {cleanJapanese(fav.japanese)}
            </p>
            <SpeakerButton text={cleanJapanese(fav.japanese)} size="sm" />
          </div>
          <p className="mt-1 italic text-sm text-muted-foreground">{fav.romaji}</p>
          <p className="mt-2 text-sm text-foreground/80">{fav.meaning}</p>
        </div>
        <button
          onClick={() => {
            if (confirm(t("fav.confirmDelete"))) removeFavorite(fav.id);
          }}
          aria-label={t("misc.deleteAria")}
          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <StylePill level={fav.level} size="sm" />
        <JlptRef level={fav.level} />
        <span className="text-[11px] text-muted-foreground">
          {intentMeta.emoji} {intentMeta.short}
        </span>
      </div>

      {fav.naturalness && (
        <div className="mt-3">
          <NaturalnessBar value={fav.naturalness} />
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {t("fav.from")} <span className="text-foreground/80">"{fav.input}"</span>
      </p>

      {(fav.grammar?.length || fav.kanji?.length || fav.why_this_level) && (
        <>
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition"
          >
            <ChevronDown
              className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")}
            />
            {open ? t("rp.hide") : t("rp.viewDetails")}
          </button>
          {open && (
            <div className="mt-4 space-y-4">
              {fav.nuance && (
                <div className="rounded-lg bg-muted/60 p-3 text-sm text-foreground/80">
                  <span className="font-medium text-foreground">{t("fav.nuance")}</span>
                  {fav.nuance}
                </div>
              )}
              {fav.why_this_level && (
                <div className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-semibold mb-1">{t("rp.whyLevel")}</p>
                  <p className="text-muted-foreground">{fav.why_this_level}</p>
                </div>
              )}
              {fav.grammar && fav.grammar.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">{t("rp.grammar")}</h3>
                  <ul className="space-y-2">
                    {fav.grammar.map((g, i) => (
                      <li key={i} className="rounded-lg border border-border p-3 text-sm">
                        <p className="font-jp font-medium">{g.pattern}</p>
                        <p className="mt-1 text-muted-foreground">{g.explanation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {fav.kanji && fav.kanji.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">{t("rp.kanji")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {fav.kanji.map((k, i) => (
                      <KanjiCard key={i} k={k} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
