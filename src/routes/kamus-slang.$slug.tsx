import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Volume2, Mic } from "lucide-react";
import { getSlang, SLANG } from "@/lib/slang-data";
import { useT } from "@/lib/i18n";
import { HanashiteTeaserBanner } from "@/components/HanashiteTeaserBanner";

export const Route = createFileRoute("/kamus-slang/$slug")({
  loader: ({ params }) => {
    const entry = getSlang(params.slug);
    if (!entry) throw notFound();
    return { entry };
  },
  head: ({ loaderData }) => {
    const e = loaderData?.entry;
    if (!e) return { meta: [{ title: "Tidak ditemukan" }] };
    return {
      meta: [
        { title: `Arti ${e.romaji} (${e.jp}) — Bahasa Jepang | NihongoLevel` },
        {
          name: "description",
          content: `${e.romaji} (${e.jp}) artinya: ${e.meaning_id}. ${e.context_id} Lihat contoh kalimat lengkap.`,
        },
        { property: "og:title", content: `Arti ${e.romaji} (${e.jp}) — Bahasa Jepang` },
        { property: "og:description", content: `${e.meaning_id} — ${e.context_id}` },
      ],
      links: [{ rel: "canonical", href: `/kamus-slang/${e.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            name: e.jp,
            alternateName: e.romaji,
            description: e.meaning_id,
            inDefinedTermSet: {
              "@type": "DefinedTermSet",
              name: "Kamus Slang Jepang — NihongoLevel",
              url: "https://nihongolevel.lovable.app/kamus-slang",
            },
          }),
        },
      ],
    };
  },
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 text-center">
      <p className="text-sm text-muted-foreground">Terjadi kesalahan.</p>
      <Link to="/kamus-slang" className="text-primary underline text-sm">Kembali ke kamus</Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 text-center">
      <h1 className="text-xl font-bold mb-2">Kata tidak ditemukan</h1>
      <Link to="/kamus-slang" className="text-primary underline text-sm">Kembali ke kamus</Link>
    </div>
  ),
  component: SlangDetail,
});

function speak(text: string) {
  speakJapanese(text, { rate: 0.9 });
}


function SlangDetail() {
  const { entry: e } = Route.useLoaderData();
  const { lang } = useT();
  const isId = lang === "id";

  const related = SLANG.filter(
    (s) => s.slug !== e.slug && s.tags.some((t) => e.tags.includes(t)),
  ).slice(0, 4);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link
        to="/kamus-slang"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {isId ? "Kamus Slang" : "Slang Dictionary"}
      </Link>

      <article className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{e.jp}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{e.romaji}</p>
          </div>
          <button
            onClick={() => speak(e.jp)}
            className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
            aria-label={isId ? "Dengarkan pengucapan" : "Play pronunciation"}
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
            {isId ? "Arti" : "Meaning"}
          </h2>
          <p className="text-lg font-semibold">{isId ? e.meaning_id : e.meaning_en}</p>
        </section>

        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
            {isId ? "Konteks" : "Context"}
          </h2>
          <p className="text-sm leading-relaxed">{isId ? e.context_id : e.context_en}</p>
        </section>

        <section className="mb-5 rounded-xl bg-muted/50 p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
            {isId ? "Contoh Kalimat" : "Example"}
          </h2>
          <div className="flex items-start justify-between gap-2">
            <p className="text-lg font-medium">{e.example_jp}</p>
            <button
              onClick={() => speak(e.example_jp)}
              className="shrink-0 p-1.5 rounded-full hover:bg-background transition"
              aria-label={isId ? "Dengarkan" : "Play"}
            >
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground italic">{e.example_romaji}</p>
          <p className="mt-1 text-sm">{isId ? e.example_id : e.example_en}</p>
        </section>

        <div className="flex flex-wrap gap-1.5">
          {e.tags.map((t: string) => (
            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      </article>

      <div className="mt-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">
              {isId
                ? `Coba ucapkan "${e.romaji}" dalam percakapan nyata`
                : `Try saying "${e.romaji}" in a real conversation`}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isId
                ? "Latih bicara bahasa Jepang dengan AI di Hanashite Room. Gratis 1 skenario."
                : "Practice speaking Japanese with AI in Hanashite Room. 1 free scenario."}
            </p>
            <Link
              to="/"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
            >
              {isId ? "Mulai Berlatih" : "Start Practice"}
            </Link>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/80 mb-3">
            {isId ? "Kata Terkait" : "Related Words"}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  to="/kamus-slang/$slug"
                  params={{ slug: r.slug }}
                  className="block rounded-lg border border-border bg-card p-3 hover:border-primary/50 transition"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold">{r.jp}</span>
                    <span className="text-xs text-muted-foreground">{r.romaji}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isId ? r.meaning_id : r.meaning_en}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <HanashiteTeaserBanner />
    </div>
  );
}
