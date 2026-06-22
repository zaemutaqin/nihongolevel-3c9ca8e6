import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SLANG } from "@/lib/slang-data";
import { useT } from "@/lib/i18n";
import { HanashiteTeaserBanner } from "@/components/HanashiteTeaserBanner";

export const Route = createFileRoute("/kamus-slang/")({
  head: () => ({
    meta: [
      { title: "Kamus Slang Jepang — Arti Kata Gaul Anime | NihongoLevel" },
      {
        name: "description",
        content:
          "Arti kata gaul Jepang dari anime, dorama, dan manga — yabai, sugoi, kawaii, tsundere, dan puluhan lainnya, dengan contoh kalimat.",
      },
      { property: "og:title", content: "Kamus Slang Jepang — Arti Kata Gaul Anime & Dorama" },
      {
        property: "og:description",
        content:
          "Cari arti kata gaul Jepang dari anime favoritmu. Yabai, sugoi, kawaii, tsundere, senpai, dan lainnya.",
      },
    ],
    links: [{ rel: "canonical", href: "/kamus-slang" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Kamus Slang Jepang — Arti Kata Gaul Anime & Dorama | NihongoLevel",
          description: "Kumpulan arti kata gaul Jepang yang sering muncul di anime, dorama, dan manga.",
          url: "https://nihongolevel.lovable.app/kamus-slang",
          mainEntity: {
            "@type": "ItemList",
            itemListElement: SLANG.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: s.jp,
              url: `https://nihongolevel.lovable.app/kamus-slang/${s.slug}`,
            })),
          },
        }),
      },
    ],
  }),
  component: SlangIndex,
});

function SlangIndex() {
  const { lang } = useT();
  const isId = lang === "id";
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return SLANG;
    return SLANG.filter((s) =>
      [s.jp, s.romaji, s.meaning_id, s.meaning_en, s.slug, ...s.tags]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [q]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {isId ? "Kamus Slang Jepang" : "Japanese Slang Dictionary"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isId
            ? "Arti kata gaul Jepang dari anime, dorama, dan percakapan sehari-hari. Klik kata untuk detail & contoh."
            : "Slang Japanese from anime, dorama, and daily conversation. Click any word for details & examples."}
        </p>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={isId ? "Cari kata (yabai, kawaii, baka...)" : "Search a word..."}
          className="w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((s) => (
          <li key={s.slug}>
            <Link
              to="/kamus-slang/$slug"
              params={{ slug: s.slug }}
              className="block rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xl font-bold">{s.jp}</span>
                <span className="text-xs text-muted-foreground">{s.romaji}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{isId ? s.meaning_id : s.meaning_en}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {s.tags.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    #{t}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          {isId ? "Tidak ada kata cocok." : "No matches."}
        </p>
      )}

      <HanashiteTeaserBanner />
    </div>
  );
}
