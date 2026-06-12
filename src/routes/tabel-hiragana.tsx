import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SpeakerButton } from "@/components/SpeakerButton";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/tabel-hiragana")({
  head: () => ({
    meta: [
      { title: "Tabel Huruf Hiragana Lengkap dan Cara Membacanya — NihongoLevel" },
      {
        name: "description",
        content:
          "Tabel huruf hiragana lengkap (gojuon, dakuten, handakuten, yoon) dengan cara baca romaji dan tombol pelafalan audio untuk pemula.",
      },
      {
        property: "og:title",
        content: "Tabel Huruf Hiragana Lengkap — NihongoLevel",
      },
      {
        property: "og:description",
        content:
          "Referensi interaktif huruf hiragana untuk pemula: dengarkan pelafalan, lihat romaji, dan pelajari semua varian dengan mudah.",
      },
      { property: "og:url", content: "https://nihongolevel.lovable.app/tabel-hiragana" },
      { property: "og:type", content: "article" },
    ],
    links: [
      { rel: "canonical", href: "https://nihongolevel.lovable.app/tabel-hiragana" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Tabel Huruf Hiragana Lengkap dan Cara Membacanya",
          description:
            "Tabel hiragana lengkap dengan romaji dan pelafalan audio untuk pemula bahasa Jepang.",
          inLanguage: "id",
          url: "https://nihongolevel.lovable.app/tabel-hiragana",
          datePublished: "2025-06-12",
          dateModified: "2025-06-12",
          author: { "@type": "Organization", name: "NihongoLevel" },
          publisher: {
            "@type": "Organization",
            name: "NihongoLevel",
            logo: {
              "@type": "ImageObject",
              url: "https://nihongolevel.lovable.app/favicon.ico",
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": "https://nihongolevel.lovable.app/tabel-hiragana",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Berapa jumlah huruf hiragana?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Hiragana dasar (gojuon) terdiri dari 46 huruf. Dengan dakuten, handakuten, dan yoon, totalnya mencapai sekitar 71+ variasi bunyi.",
              },
            },
            {
              "@type": "Question",
              name: "Apa perbedaan hiragana dan katakana?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Hiragana digunakan untuk kata asli Jepang dan partikel grammar. Katakana digunakan untuk kata serapan dari bahasa asing, nama hewan/ilmu, dan penekanan.",
              },
            },
            {
              "@type": "Question",
              name: "Berapa lama waktu yang dibutuhkan untuk menghafal hiragana?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Dengan latihan 15-30 menit per hari, kebanyakan pemula bisa menghafal semua hiragana dalam 1-2 minggu.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: TabelHiraganaPage,
});

type Cell = { kana: string; romaji: string } | null;

// Gojuon (basic 46 + n)
const GOJUON: { row: string; cells: Cell[] }[] = [
  { row: "a", cells: [
    { kana: "あ", romaji: "a" }, { kana: "い", romaji: "i" }, { kana: "う", romaji: "u" }, { kana: "え", romaji: "e" }, { kana: "お", romaji: "o" },
  ]},
  { row: "k", cells: [
    { kana: "か", romaji: "ka" }, { kana: "き", romaji: "ki" }, { kana: "く", romaji: "ku" }, { kana: "け", romaji: "ke" }, { kana: "こ", romaji: "ko" },
  ]},
  { row: "s", cells: [
    { kana: "さ", romaji: "sa" }, { kana: "し", romaji: "shi" }, { kana: "す", romaji: "su" }, { kana: "せ", romaji: "se" }, { kana: "そ", romaji: "so" },
  ]},
  { row: "t", cells: [
    { kana: "た", romaji: "ta" }, { kana: "ち", romaji: "chi" }, { kana: "つ", romaji: "tsu" }, { kana: "て", romaji: "te" }, { kana: "と", romaji: "to" },
  ]},
  { row: "n", cells: [
    { kana: "な", romaji: "na" }, { kana: "に", romaji: "ni" }, { kana: "ぬ", romaji: "nu" }, { kana: "ね", romaji: "ne" }, { kana: "の", romaji: "no" },
  ]},
  { row: "h", cells: [
    { kana: "は", romaji: "ha" }, { kana: "ひ", romaji: "hi" }, { kana: "ふ", romaji: "fu" }, { kana: "へ", romaji: "he" }, { kana: "ほ", romaji: "ho" },
  ]},
  { row: "m", cells: [
    { kana: "ま", romaji: "ma" }, { kana: "み", romaji: "mi" }, { kana: "む", romaji: "mu" }, { kana: "め", romaji: "me" }, { kana: "も", romaji: "mo" },
  ]},
  { row: "y", cells: [
    { kana: "や", romaji: "ya" }, null, { kana: "ゆ", romaji: "yu" }, null, { kana: "よ", romaji: "yo" },
  ]},
  { row: "r", cells: [
    { kana: "ら", romaji: "ra" }, { kana: "り", romaji: "ri" }, { kana: "る", romaji: "ru" }, { kana: "れ", romaji: "re" }, { kana: "ろ", romaji: "ro" },
  ]},
  { row: "w", cells: [
    { kana: "わ", romaji: "wa" }, null, null, null, { kana: "を", romaji: "wo" },
  ]},
  { row: "n2", cells: [
    { kana: "ん", romaji: "n" }, null, null, null, null,
  ]},
];

// Dakuten + Handakuten
const DAKUTEN: { row: string; cells: Cell[] }[] = [
  { row: "g", cells: [
    { kana: "が", romaji: "ga" }, { kana: "ぎ", romaji: "gi" }, { kana: "ぐ", romaji: "gu" }, { kana: "げ", romaji: "ge" }, { kana: "ご", romaji: "go" },
  ]},
  { row: "z", cells: [
    { kana: "ざ", romaji: "za" }, { kana: "じ", romaji: "ji" }, { kana: "ず", romaji: "zu" }, { kana: "ぜ", romaji: "ze" }, { kana: "ぞ", romaji: "zo" },
  ]},
  { row: "d", cells: [
    { kana: "だ", romaji: "da" }, { kana: "ぢ", romaji: "ji" }, { kana: "づ", romaji: "zu" }, { kana: "で", romaji: "de" }, { kana: "ど", romaji: "do" },
  ]},
  { row: "b", cells: [
    { kana: "ば", romaji: "ba" }, { kana: "び", romaji: "bi" }, { kana: "ぶ", romaji: "bu" }, { kana: "べ", romaji: "be" }, { kana: "ぼ", romaji: "bo" },
  ]},
  { row: "p", cells: [
    { kana: "ぱ", romaji: "pa" }, { kana: "ぴ", romaji: "pi" }, { kana: "ぷ", romaji: "pu" }, { kana: "ぺ", romaji: "pe" }, { kana: "ぽ", romaji: "po" },
  ]},
];

// Yoon (combined)
const YOON: { kana: string; romaji: string }[][] = [
  [
    { kana: "きゃ", romaji: "kya" }, { kana: "きゅ", romaji: "kyu" }, { kana: "きょ", romaji: "kyo" },
  ],
  [
    { kana: "しゃ", romaji: "sha" }, { kana: "しゅ", romaji: "shu" }, { kana: "しょ", romaji: "sho" },
  ],
  [
    { kana: "ちゃ", romaji: "cha" }, { kana: "ちゅ", romaji: "chu" }, { kana: "ちょ", romaji: "cho" },
  ],
  [
    { kana: "にゃ", romaji: "nya" }, { kana: "にゅ", romaji: "nyu" }, { kana: "にょ", romaji: "nyo" },
  ],
  [
    { kana: "ひゃ", romaji: "hya" }, { kana: "ひゅ", romaji: "hyu" }, { kana: "ひょ", romaji: "hyo" },
  ],
  [
    { kana: "みゃ", romaji: "mya" }, { kana: "みゅ", romaji: "myu" }, { kana: "みょ", romaji: "myo" },
  ],
  [
    { kana: "りゃ", romaji: "rya" }, { kana: "りゅ", romaji: "ryu" }, { kana: "りょ", romaji: "ryo" },
  ],
  [
    { kana: "ぎゃ", romaji: "gya" }, { kana: "ぎゅ", romaji: "gyu" }, { kana: "ぎょ", romaji: "gyo" },
  ],
  [
    { kana: "じゃ", romaji: "ja" }, { kana: "じゅ", romaji: "ju" }, { kana: "じょ", romaji: "jo" },
  ],
  [
    { kana: "びゃ", romaji: "bya" }, { kana: "びゅ", romaji: "byu" }, { kana: "びょ", romaji: "byo" },
  ],
  [
    { kana: "ぴゃ", romaji: "pya" }, { kana: "ぴゅ", romaji: "pyu" }, { kana: "ぴょ", romaji: "pyo" },
  ],
];

function KanaCell({ cell }: { cell: Cell }) {
  if (!cell) {
    return <div className="aspect-square rounded-md bg-muted/30" aria-hidden />;
  }
  return (
    <div className="aspect-square rounded-md border border-border bg-card flex flex-col items-center justify-center gap-1 p-1 hover:border-primary/60 transition-colors">
      <div className="text-2xl sm:text-3xl font-bold leading-none">{cell.kana}</div>
      <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
        {cell.romaji}
      </div>
      <SpeakerButton text={cell.kana} size="sm" />
    </div>
  );
}

function TabelHiraganaPage() {
  const lang = useLang();
  const isId = lang === "id";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link to="/" className="font-bold text-lg">
          Nihongo<span className="text-primary">Level</span>
        </Link>
        <Link
          to="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {isId ? "Kembali" : "Back"}
        </Link>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            {isId ? "Referensi Pemula" : "Beginner Reference"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isId
              ? "Tabel Huruf Hiragana Lengkap"
              : "Complete Hiragana Chart"}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            {isId
              ? "Pelajari semua huruf hiragana — dasar (gojuon), dakuten, handakuten, dan yōon — lengkap dengan cara baca romaji dan tombol pelafalan."
              : "Learn every hiragana character — gojuon, dakuten, handakuten, and yōon — with romaji readings and audio pronunciation."}
          </p>
        </div>

        {/* Gojuon */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-3">
            {isId ? "Hiragana Dasar (Gojūon)" : "Basic Hiragana (Gojūon)"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {isId
              ? "46 huruf dasar yang menjadi fondasi semua kata bahasa Jepang."
              : "The 46 base characters that form the foundation of all Japanese words."}
          </p>
          <div className="space-y-2">
            {GOJUON.map((row) => (
              <div key={row.row} className="grid grid-cols-5 gap-2">
                {row.cells.map((c, i) => (
                  <KanaCell key={i} cell={c} />
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Dakuten */}
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-3">
            {isId ? "Dakuten & Handakuten" : "Dakuten & Handakuten"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {isId
              ? "Tanda dakuten (゛) dan handakuten (゜) mengubah bunyi huruf dasar, misalnya か (ka) → が (ga)."
              : "Dakuten (゛) and handakuten (゜) marks change the sound of base characters, e.g. か (ka) → が (ga)."}
          </p>
          <div className="space-y-2">
            {DAKUTEN.map((row) => (
              <div key={row.row} className="grid grid-cols-5 gap-2">
                {row.cells.map((c, i) => (
                  <KanaCell key={i} cell={c} />
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Yoon */}
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-3">
            {isId ? "Yōon (Huruf Gabungan)" : "Yōon (Combined Characters)"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {isId
              ? "Huruf gabungan dengan ゃ ゅ ょ kecil untuk membentuk bunyi seperti きゃ (kya)."
              : "Combined characters using small ゃ ゅ ょ to form sounds like きゃ (kya)."}
          </p>
          <div className="space-y-2">
            {YOON.map((row, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2">
                {row.map((c, i) => (
                  <KanaCell key={i} cell={c} />
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section className="mt-12 rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold mb-2">
            {isId ? "Tips Belajar Hiragana" : "Tips for Learning Hiragana"}
          </h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
            <li>
              {isId
                ? "Mulai dari baris vokal あ・い・う・え・お, lalu tambah satu baris per hari."
                : "Start with vowels あ・い・う・え・お, then add one row per day."}
            </li>
            <li>
              {isId
                ? "Tulis tangan beberapa kali untuk memperkuat ingatan otot."
                : "Hand-write each character several times to build muscle memory."}
            </li>
            <li>
              {isId
                ? "Dengarkan pelafalan dengan tombol speaker dan ulangi keras-keras."
                : "Listen with the speaker button and repeat out loud."}
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {isId
              ? "Sudah hafal hiragana? Coba terjemahan situasional natural ala native speaker."
              : "Mastered hiragana? Try natural situational translations like a native speaker."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90"
          >
            {isId ? "Coba Penerjemah Situasional" : "Try the Situational Translator"}
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
