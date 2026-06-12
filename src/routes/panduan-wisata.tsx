import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import {
  Plane,
  Hotel,
  Utensils,
  ShoppingBag,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/panduan-wisata")({
  head: () => ({
    meta: [
      {
        title:
          "Panduan Bahasa Jepang untuk Wisatawan — NihongoLevel",
      },
      {
        name: "description",
        content:
          "Kosakata & ekspresi bahasa Jepang untuk traveling: bandara, hotel, restoran, belanja, arah, darurat. Tingkat sopan N4–N1.",
      },
      {
        property: "og:title",
        content: "Panduan Bahasa Jepang untuk Wisatawan — NihongoLevel",
      },
      {
        property: "og:description",
        content:
          "Kosakata dan ekspresi bahasa Jepang natural untuk traveling dengan tingkat kesopanan N4–N1.",
      },
      { property: "og:url", content: "/panduan-wisata" },
    ],
    links: [
      { rel: "canonical", href: "/panduan-wisata" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Panduan Bahasa Jepang Natural untuk Wisatawan",
          description:
            "Kosakata dan ekspresi bahasa Jepang untuk traveling dengan tingkat kesopanan N4–N1.",
          url: "https://nihongolevel.lovable.app/panduan-wisata",
          author: {
            "@type": "Organization",
            name: "NihongoLevel",
          },
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
            "@id": "https://nihongolevel.lovable.app/panduan-wisata",
          },
        }),
      },
    ],
  }),

  component: PanduanWisataPage,
});

interface Expression {
  id: string;
  situation: string;
  situationEn: string;
  rows: ExpressionRow[];
}

interface ExpressionRow {
  level: "N4" | "N3" | "N2" | "N1";
  japanese: string;
  romaji: string;
  meaning: string;
  meaningEn: string;
  when: string;
  whenEn: string;
}

const EXPRESSIONS: Expression[] = [
  {
    id: "airport",
    situation: "Di Bandara",
    situationEn: "At the Airport",
    rows: [
      {
        level: "N4",
        japanese: "このバスは駅に行きますか。",
        romaji: "Kono basu wa eki ni ikimasu ka.",
        meaning: "Apakah bus ini ke stasiun?",
        meaningEn: "Does this bus go to the station?",
        when: "Tanya ke staf bandara secara santai",
        whenEn: "Asking airport staff casually",
      },
      {
        level: "N3",
        japanese: "すみません、駅行きのバスはどこから出ますか。",
        romaji: "Sumimasen, eki-yuki no basu wa doko kara demasu ka.",
        meaning: "Permisi, dari mana bus ke stasiun berangkat?",
        meaningEn: "Excuse me, where does the bus to the station depart from?",
        when: "Tanya ke staf secara sopan",
        whenEn: "Asking staff politely",
      },
      {
        level: "N2",
        japanese: "恐れ入りますが、駅までのバス乗り場を教えていただけますでしょうか。",
        romaji: "Osoreirimasu ga, eki made no basu noriba o oshiete itadakemasu deshou ka.",
        meaning: "Maaf, bisakah Anda memberitahu tempat naik bus ke stasiun?",
        meaningEn: "I'm sorry, could you tell me where to board the bus to the station?",
        when: "Tanya dengan sangat sopan ke staf senior",
        whenEn: "Asking very politely to senior staff",
      },
      {
        level: "N1",
        japanese: "大変恐縮ではございますが、駅行きシャトルバスの発車場所をご教示いただけますでしょうか。",
        romaji: "Taihen kyoshuku de wa gozaimasu ga, eki-yuki shatoru basu no hassha basho o go-kyouji itadakemasu deshou ka.",
        meaning: "Sangat mohon maaf, bisakah Anda memberitahu lokasi keberangkatan shuttle bus ke stasiun?",
        meaningEn: "Very sorry to bother you, but could you inform me of the shuttle bus departure location?",
        when: "Situasi formal / bisnis di bandara",
        whenEn: "Formal/business situation at the airport",
      },
    ],
  },
  {
    id: "hotel",
    situation: "Check-in Hotel",
    situationEn: "Hotel Check-in",
    rows: [
      {
        level: "N4",
        japanese: "予約しました。名前はスマンです。",
        romaji: "Yoyaku shimashita. Namae wa Sumanto desu.",
        meaning: "Saya sudah booking. Nama saya Suman.",
        meaningEn: "I have a reservation. My name is Suman.",
        when: "Check-in santai ke resepsionis",
        whenEn: "Casual check-in at reception",
      },
      {
        level: "N3",
        japanese: "先週予約させていただいたスマンと申します。",
        romaji: "Senshuu yoyaku sasete itadaita Sumanto to moushimasu.",
        meaning: "Perkenalkan, saya Suman yang memesan minggu lalu.",
        meaningEn: "My name is Suman; I made a reservation last week.",
        when: "Check-in sopan ke resepsionis",
        whenEn: "Polite check-in at reception",
      },
      {
        level: "N2",
        japanese: "お世話になっております。スマンと申します。先週オンラインにてご予約させていただきました。",
        romaji: "Osewa ni natte orimasu. Sumanto to moushimasu. Senshuu onrain ni te go-yoyaku sasete itadakimashita.",
        meaning: "Terima kasih atas bantuannya. Saya Suman. Saya telah memesan secara online minggu lalu.",
        meaningEn: "Thank you for your assistance. I'm Suman. I made a reservation online last week.",
        when: "Check-in sangat sopan di hotel mewah",
        whenEn: "Very polite check-in at a luxury hotel",
      },
      {
        level: "N1",
        japanese: "本日はお世話になっております。スマンと申します。先週当館のウェブサイトにてご予約の手続きをさせていただきました。",
        romaji: "Honjitsu wa osewa ni natte orimasu. Sumanto to moushimasu. Senshuu toukan no uebu-saito nite go-yoyaku no tetsuzuki o sasete itadakimashita.",
        meaning: "Hari ini terima kasih atas bantuannya. Saya Suman. Minggu lalu saya telah melakukan prosedur pemesanan melalui website hotel ini.",
        meaningEn: "Today I am in your care. I am Suman. Last week I completed the reservation procedure through this hotel's website.",
        when: "Check-in sangat formal di ryokan/ hotel bintang 5",
        whenEn: "Very formal check-in at a ryokan or 5-star hotel",
      },
    ],
  },
  {
    id: "restaurant",
    situation: "Di Restoran",
    situationEn: "At a Restaurant",
    rows: [
      {
        level: "N4",
        japanese: "これ、おいしい。おすすめは何？",
        romaji: "Kore, oishii. Osusume wa nani?",
        meaning: "Ini enak. Apa rekomendasinya?",
        meaningEn: "This is good. What's recommended?",
        when: "Bicara ke pelayan di izakaya / tempat kasual",
        whenEn: "Talking to staff at an izakaya or casual place",
      },
      {
        level: "N3",
        japanese: "すみません、今日のおすすめメニューは何ですか。",
        romaji: "Sumimasen, kyou no osusume menyuu wa nan desu ka.",
        meaning: "Permisi, apa menu rekomendasi hari ini?",
        meaningEn: "Excuse me, what's today's recommended menu?",
        when: "Tanya ke pelayan restoran biasa",
        whenEn: "Asking a server at a regular restaurant",
      },
      {
        level: "N2",
        japanese: "失礼いたしますが、本日のおすすめを教えていただけますでしょうか。",
        romaji: "Shitsurei itashimasu ga, honjitsu no osusume o oshiete itadakemasu deshou ka.",
        meaning: "Maaf mengganggu, bisakah Anda memberitahu rekomendasi hari ini?",
        meaningEn: "Pardon me, could you tell me today's recommendations?",
        when: "Restoran mewah / tempat spesial",
        whenEn: "At a fancy or special restaurant",
      },
      {
        level: "N1",
        japanese: "恐れ入りますが、本日のおすすめ料理をご案内いただけますでしょうか。",
        romaji: "Osoreirimasu ga, honjitsu no osusume ryouri o go-annai itadakemasu deshou ka.",
        meaning: "Maaf, bisakah Anda memperkenalkan hidangan rekomendasi hari ini?",
        meaningEn: "Sorry to trouble you, could you introduce today's recommended dishes?",
        when: "Kaiseki / tempat makan super formal",
        whenEn: "At kaiseki or super formal dining",
      },
    ],
  },
  {
    id: "shopping",
    situation: "Belanja",
    situationEn: "Shopping",
    rows: [
      {
        level: "N4",
        japanese: "これ、試着していい？",
        romaji: "Kore, shichaku shite ii?",
        meaning: "Bolehkah aku mencoba ini?",
        meaningEn: "Can I try this on?",
        when: "Tanya ke staf toko santai",
        whenEn: "Casually asking store staff",
      },
      {
        level: "N3",
        japanese: "すみません、このシャツを試着させていただけますか。",
        romaji: "Sumimasen, kono shatsu o shichaku sasete itadakemasu ka.",
        meaning: "Permisi, bisakah saya mencoba kemeja ini?",
        meaningEn: "Excuse me, may I try on this shirt?",
        when: "Tanya sopan di butik / department store",
        whenEn: "Politely asking at a boutique or department store",
      },
      {
        level: "N2",
        japanese: "恐れ入りますが、こちらの商品を試着させていただけますでしょうか。",
        romaji: "Osoreirimasu ga, kochira no shouhin o shichaku sasete itadakemasu deshou ka.",
        meaning: "Maaf, bisakah saya mencoba barang ini?",
        meaningEn: "I'm sorry, could I try on this item?",
        when: "Toko mewah / butik high-end",
        whenEn: "At a luxury store or high-end boutique",
      },
      {
        level: "N1",
        japanese: "大変恐縮ではございますが、こちらの商品を試着させていただけないでしょうか。",
        romaji: "Taihen kyoshuku de wa gozaimasu ga, kochira no shouhin o shichaku sasete itadakenai deshou ka.",
        meaning: "Sangat mohon maaf, bisakah saya diizinkan mencoba barang ini?",
        meaningEn: "Very sorry to trouble you, but might I be allowed to try on this item?",
        when: "Butik luxury / tempat butik Jepang tradisional",
        whenEn: "At a luxury boutique or traditional Japanese boutique",
      },
    ],
  },
  {
    id: "directions",
    situation: "Bertanya Arah",
    situationEn: "Asking for Directions",
    rows: [
      {
        level: "N4",
        japanese: "駅はどこ？",
        romaji: "Eki wa doko?",
        meaning: "Stasiun di mana?",
        meaningEn: "Where is the station?",
        when: "Tanya teman / orang muda",
        whenEn: "Asking a friend or younger person",
      },
      {
        level: "N3",
        japanese: "すみません、駅はどちらですか。",
        romaji: "Sumimasen, eki wa dochira desu ka.",
        meaning: "Permisi, stasiun ke arah mana ya?",
        meaningEn: "Excuse me, which way is the station?",
        when: "Tanya orang di jalan secara sopan",
        whenEn: "Politely asking someone on the street",
      },
      {
        level: "N2",
        japanese: "すみませんが、駅への行き方を教えていただけますでしょうか。",
        romaji: "Sumimasen ga, eki e no ikikata o oshiete itadakemasu deshou ka.",
        meaning: "Maaf, bisakah Anda memberitahu cara ke stasiun?",
        meaningEn: "Excuse me, could you tell me how to get to the station?",
        when: "Tanya orang yang tidak dikenal dengan sopan",
        whenEn: "Politely asking a stranger",
      },
      {
        level: "N1",
        japanese: "恐れ入りますが、駅までの道筋をご教示いただけますでしょうか。",
        romaji: "Osoreirimasu ga, eki made no michisuji o go-kyouji itadakemasu deshou ka.",
        meaning: "Maaf, bisakah Anda memberitahu jalan ke stasiun?",
        meaningEn: "I'm sorry, could you indicate the way to the station?",
        when: "Tanya ke polisi / stasun info / orang tua",
        whenEn: "Asking police, info desk, or elderly person",
      },
    ],
  },
  {
    id: "emergency",
    situation: "Darurat",
    situationEn: "Emergency",
    rows: [
      {
        level: "N4",
        japanese: "助けて！盗まれた！",
        romaji: "Tasukete! Nusumareta!",
        meaning: "Tolong! Aku dirampok!",
        meaningEn: "Help! I've been robbed!",
        when: "Situasi darurat — teriak langsung",
        whenEn: "Emergency — shout directly",
      },
      {
        level: "N3",
        japanese: "すみません、警察を呼んでください。",
        romaji: "Sumimasen, keisatsu o yonde kudasai.",
        meaning: "Permisi, panggilkan polisi.",
        meaningEn: "Excuse me, please call the police.",
        when: "Minta bantuan secara sopan saat darurat",
        whenEn: "Politely asking for help during emergency",
      },
      {
        level: "N2",
        japanese: "大変申し訳ございませんが、警察をお呼びいただけますでしょうか。",
        romaji: "Taihen moushiwake gozaimasen ga, keisatsu o oyobi itadakemasu deshou ka.",
        meaning: "Sangat maaf, bisakah Anda memanggil polisi?",
        meaningEn: "Very sorry, but could you call the police?",
        when: "Ke hotel / staf toko saat kecelakaan",
        whenEn: "To hotel or store staff during an incident",
      },
      {
        level: "N1",
        japanese: "誠に恐縮ではございますが、至急警察の方をお呼びいただけますでしょうか。",
        romaji: "Makoto ni kyoshuku de wa gozaimasu ga, shikyuu keisatsu no kata o oyobi itadakemasu deshou ka.",
        meaning: "Sangat mohon maaf, bisakah Anda segera memanggil polisi?",
        meaningEn: "Truly sorry to trouble you, but could you urgently call the police?",
        when: "Situasi formal / bisnis saat kecelakaan",
        whenEn: "Formal/business situation during an incident",
      },
    ],
  },
];

const LEVEL_META: Record<
  string,
  { label: string; labelEn: string; color: string; bg: string }
> = {
  N4: {
    label: "Dasar",
    labelEn: "Basic",
    color: "text-[oklch(0.42_0.12_152)]",
    bg: "bg-[oklch(0.42_0.12_152)]/10",
  },
  N3: {
    label: "Sehari-hari",
    labelEn: "Everyday",
    color: "text-[oklch(0.38_0.13_245)]",
    bg: "bg-[oklch(0.38_0.13_245)]/10",
  },
  N2: {
    label: "Ekspresif",
    labelEn: "Expressive",
    color: "text-[oklch(0.48_0.14_65)]",
    bg: "bg-[oklch(0.48_0.14_65)]/10",
  },
  N1: {
    label: "Mendekati Native",
    labelEn: "Near-Native",
    color: "text-[oklch(0.45_0.16_25)]",
    bg: "bg-[oklch(0.45_0.16_25)]/10",
  },
};

function PanduanWisataPage() {
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
        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            {isId ? "Panduan Natural" : "Natural Guide"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isId
              ? "Bahasa Jepang untuk Wisatawan"
              : "Japanese for Travelers"}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            {isId
              ? "Kosakata dan ekspresi bahasa Jepang natural untuk traveling. Bedakan tingkat kesopanan N4–N1 seperti native speaker — bukan sekadar kamus."
              : "Natural Japanese vocabulary and expressions for traveling. Distinguish politeness levels N4–N1 like a native speaker — not just a dictionary."}
          </p>
        </div>

        {/* Level legend */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {(["N4", "N3", "N2", "N1"] as const).map((lvl) => {
            const meta = LEVEL_META[lvl];
            return (
              <div
                key={lvl}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.bg} ${meta.color}`}
              >
                <span className="font-bold">{lvl}</span>
                <span>{isId ? meta.label : meta.labelEn}</span>
              </div>
            );
          })}
        </div>

        {/* TOC */}
        <nav className="mt-10 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-3">
            {isId ? "Daftar Isi" : "Table of Contents"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {EXPRESSIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition"
              >
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                {isId ? section.situation : section.situationEn}
              </a>
            ))}
          </div>
        </nav>

        {/* Sections */}
        <div className="mt-10 space-y-14">
          {EXPRESSIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <div className="flex items-center gap-3 mb-5">
                <SectionIcon id={section.id} />
                <h2 className="text-xl sm:text-2xl font-bold">
                  {isId ? section.situation : section.situationEn}
                </h2>
              </div>

              <div className="space-y-4">
                {section.rows.map((row, i) => {
                  const meta = LEVEL_META[row.level];
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-border bg-card p-4 sm:p-5 transition hover:border-primary/30"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.bg} ${meta.color}`}
                        >
                          {row.level}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isId ? meta.label : meta.labelEn}
                        </span>
                      </div>

                      <p className="text-lg sm:text-xl font-jp font-semibold text-foreground leading-relaxed">
                        {row.japanese}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {row.romaji}
                      </p>

                      <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-xs uppercase font-semibold text-muted-foreground">
                            {isId ? "Arti" : "Meaning"}
                          </span>
                          <p className="mt-0.5 text-foreground">
                            {isId ? row.meaning : row.meaningEn}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs uppercase font-semibold text-muted-foreground">
                            {isId ? "Kapan dipakai" : "When to use"}
                          </span>
                          <p className="mt-0.5 text-foreground">
                            {isId ? row.when : row.whenEn}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <h3 className="text-lg font-bold text-foreground">
            {isId
              ? "Ingin ekspresi yang lebih spesifik?"
              : "Want more specific expressions?"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            {isId
              ? "Masukkan situasimu sendiri dan NihongoLevel akan memberikan ekspresi natural di semua level kesopanan — dengan analisis situasi lengkap."
              : "Enter your own situation and NihongoLevel will give you natural expressions at all politeness levels — with full situation analysis."}
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition"
          >
            <Sparkles className="w-4 h-4" />
            {isId ? "Coba Sekarang — Gratis" : "Try Now — Free"}
          </Link>
        </div>

        {/* Related keywords for SEO */}
        <div className="mt-10 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">
            {isId ? "Kata kunci terkait:" : "Related keywords:"}
          </p>
          <p>
            {isId
              ? "kosakata bahasa jepang, bahasa jepang wisata, kosakata bahasa jepang untuk wisata, ekspresi bahasa jepang natural, belajar bahasa jepang untuk traveling, keigo bahasa jepang, tingkat kesopanan bahasa jepang, frasa bahasa jepang bandara, bahasa jepang restoran, bahasa jepang hotel"
              : "Japanese vocabulary, Japanese for travel, Japanese travel expressions, natural Japanese expressions, learn Japanese for traveling, Japanese keigo, Japanese politeness levels, Japanese airport phrases, Japanese restaurant phrases, Japanese hotel phrases"}
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionIcon({ id }: { id: string }) {
  const cls = "w-5 h-5 text-primary";
  switch (id) {
    case "airport":
      return <Plane className={cls} />;
    case "hotel":
      return <Hotel className={cls} />;
    case "restaurant":
      return <Utensils className={cls} />;
    case "shopping":
      return <ShoppingBag className={cls} />;
    case "directions":
      return <MapPin className={cls} />;
    case "emergency":
      return <AlertTriangle className={cls} />;
    default:
      return <Sparkles className={cls} />;
  }
}
