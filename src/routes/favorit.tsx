import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import {
  getFavorites,
  removeFavorite,
  useLocalCollection,
  type FavoriteEntry,
} from "@/lib/storage";
import { INTENT_LABELS, NaturalnessBar, StylePill, JlptRef, KanjiCard, cleanJapanese } from "@/components/result-parts";
import { SpeakerButton } from "@/components/SpeakerButton";
import { cn } from "@/lib/utils";
import type { IntentType } from "@/lib/translate.functions";

export const Route = createFileRoute("/favorit")({
  head: () => ({ meta: [{ title: "Favorit — NihongoLevel" }] }),
  component: FavoritPage,
});

const FILTERS: { value: IntentType | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "monolog", label: "Monolog" },
  { value: "asking_others", label: "Tanya ke orang" },
  { value: "casual_conversation", label: "Kasual" },
  { value: "professional_formal", label: "Profesional" },
  { value: "joking_relaxed", label: "Bercanda" },
];

function FavoritPage() {
  const [favs] = useLocalCollection<FavoriteEntry>(getFavorites);
  const [filter, setFilter] = useState<IntentType | "all">("all");

  const filtered = useMemo(
    () => (filter === "all" ? favs : favs.filter((f) => f.intent.type === filter)),
    [favs, filter],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Favorit</h1>

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
          <p className="font-semibold">Belum ada favorit</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Simpan ekspresi favorit dari halaman Cari atau Riwayat untuk meninjaunya di sini.
          </p>
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
  const [open, setOpen] = useState(false);
  const tone = `level-${(fav.level || "N3").toLowerCase()}`;
  const intentMeta = INTENT_LABELS[fav.intent.type];
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
            if (confirm("Hapus favorit ini?")) removeFavorite(fav.id);
          }}
          aria-label="Hapus"
          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <StylePill level={fav.level} size="sm" />
        <JlptRef level={fav.level} />
        <span className="text-[11px] text-muted-foreground">
          {intentMeta?.emoji} {intentMeta?.short ?? fav.intent.type}
        </span>
      </div>

      {fav.naturalness && (
        <div className="mt-3">
          <NaturalnessBar value={fav.naturalness} />
        </div>
      )}


      <p className="mt-3 text-xs text-muted-foreground">
        Dari: <span className="text-foreground/80">"{fav.input}"</span>
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
            {open ? "Sembunyikan" : "Lihat detail"}
          </button>
          {open && (
            <div className="mt-4 space-y-4">
              {fav.nuance && (
                <div className="rounded-lg bg-muted/60 p-3 text-sm text-foreground/80">
                  <span className="font-medium text-foreground">Nuansa: </span>
                  {fav.nuance}
                </div>
              )}
              {fav.why_this_level && (
                <div className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-semibold mb-1">Kenapa level ini?</p>
                  <p className="text-muted-foreground">{fav.why_this_level}</p>
                </div>
              )}
              {fav.grammar && fav.grammar.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Tata Bahasa</h3>
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
                  <h3 className="text-sm font-semibold mb-2">Kanji</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {fav.kanji.map((k, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-background p-3"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-jp text-3xl font-bold leading-none">{k.char}</span>
                          <span
                            className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `var(--level-${(k.jlpt || "N4").toLowerCase()})`,
                            }}
                          >
                            {k.jlpt}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground font-jp">
                          {k.reading}
                        </p>
                        <p className="mt-1 text-xs font-medium">{k.meaning}</p>
                      </div>
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
