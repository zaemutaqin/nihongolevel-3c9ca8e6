import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Languages,
  Trophy,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Building2,
  UtensilsCrossed,
  Hotel,
  Stethoscope,
  Store,
  CheckCircle2,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { SignInButton } from "@/components/SignInButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NihongoLevel — Prepare for Work and Life in Japan with AI" },
      {
        name: "description",
        content:
          "Latih interview Tokutei Ginou, percakapan dengan atasan Jepang, dan situasi sehari-hari di Jepang dengan AI. Translator natural + simulasi wawancara untuk pekerja Indonesia.",
      },
      { property: "og:title", content: "NihongoLevel — Prepare for Work and Life in Japan" },
      {
        property: "og:description",
        content:
          "Practice Japanese interviews, workplace conversations, and real-life Japanese before moving to Japan.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomeIndex,
});

const INK = "#0F172A";
const INK_SOFT = "#334155";
const ACCENT = "#DC2626"; // Japan red accent per PRD

function HomeIndex() {
  const { lang } = useT();
  const { user } = useAuth();
  const isId = lang === "id";

  return (
    <div className="w-full bg-white" style={{ color: INK }}>
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
        {/* HERO */}
        <header className="mb-20 sm:mb-24 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
          <div>
            <span
              className="inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] mb-5"
              style={{ border: `2px solid ${INK}`, color: INK }}
            >
              {isId ? "AI Coach untuk Pekerja Indonesia" : "AI Coach for Workers"}
            </span>
            <h1 className="font-black leading-[1.05] mb-6 text-[40px] sm:text-[52px] lg:text-[64px] tracking-tight">
              {isId ? (
                <>
                  Siap Kerja & Hidup
                  <br />
                  di Jepang dengan{" "}
                  <span style={{ color: ACCENT }}>AI</span>
                </>
              ) : (
                <>
                  Prepare for Work & Life
                  <br />
                  in Japan with <span style={{ color: ACCENT }}>AI</span>
                </>
              )}
            </h1>
            <p
              className="text-lg sm:text-xl leading-relaxed mb-8 max-w-2xl"
              style={{ color: INK_SOFT }}
            >
              {isId
                ? "Latih wawancara kerja, percakapan dengan atasan, dan situasi sehari-hari di Jepang sebelum berangkat. Skenario realistis + feedback grammar & keigo instan."
                : "Practice interviews, workplace conversations, and real-life Japanese before moving to Japan. Realistic scenarios + instant grammar & keigo feedback."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Link
                to="/interview"
                className="inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-4 text-base sm:text-lg font-black text-white hover:translate-y-[-2px] transition-transform"
                style={{ background: ACCENT, border: `3px solid ${INK}` }}
              >
                {isId ? "Coba Interview Simulator" : "Try Interview Simulator"}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/translate"
                className="inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-4 text-base sm:text-lg font-bold"
                style={{ border: `3px solid ${INK}`, color: INK }}
              >
                {isId ? "Mulai Gratis" : "Start Free"}
              </Link>
            </div>

            {!user && (
              <div className="mt-6 flex items-center gap-3">
                <SignInButton />
                <span className="text-sm" style={{ color: INK_SOFT }}>
                  {isId ? "Gratis. Tanpa kartu kredit." : "Free. No credit card."}
                </span>
              </div>
            )}
          </div>

          {/* Right column: visual stack of 'goals' */}
          <div className="hidden lg:block">
            <div className="space-y-3">
              {(isId
                ? [
                    { icon: Briefcase, label: "Lolos interview Tokutei Ginou" },
                    { icon: Building2, label: "Berkomunikasi dengan atasan Jepang" },
                    { icon: Stethoscope, label: "Siap kerja di rumah sakit / care home" },
                    { icon: Hotel, label: "Siap kerja di hotel & restoran" },
                  ]
                : [
                    { icon: Briefcase, label: "Pass Tokutei Ginou interview" },
                    { icon: Building2, label: "Talk to Japanese bosses confidently" },
                    { icon: Stethoscope, label: "Ready for hospital / care work" },
                    { icon: Hotel, label: "Ready for hotel & restaurant work" },
                  ]
              ).map(({ icon: Icon, label }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4"
                  style={{ border: `2px solid ${INK}`, background: i % 2 ? "#FEF2F2" : "white" }}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{ background: ACCENT }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold" style={{ color: INK }}>
                    {label}
                  </span>
                  <CheckCircle2 className="ml-auto w-5 h-5" style={{ color: ACCENT }} />
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* WHY NIHONGOLEVEL */}
        <section className="mb-24">
          <h2
            className="text-2xl sm:text-3xl font-black mb-8 inline-block pb-2"
            style={{ borderBottom: `4px solid ${INK}` }}
          >
            {isId ? "Kenapa NihongoLevel" : "Why NihongoLevel"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <WhyCard
              icon={Languages}
              title={isId ? "Translator Natural" : "Natural Translator"}
              desc={
                isId
                  ? "4 level: Casual, Polite, Workplace, Keigo. Bukan terjemahan kaku."
                  : "4 levels: Casual, Polite, Workplace, Keigo. Not stiff translation."
              }
            />
            <WhyCard
              icon={Briefcase}
              title={isId ? "Latihan Interview" : "Interview Practice"}
              desc={
                isId
                  ? "AI berperan jadi pewawancara Jepang. Tanpa rasa malu."
                  : "AI plays the Japanese interviewer. Zero anxiety."
              }
            />
            <WhyCard
              icon={MessageSquare}
              title={isId ? "Simulasi Nyata" : "Real-Life Sim"}
              desc={
                isId
                  ? "Konbini, restoran, klinik, hotel — siap menghadapi situasi nyata."
                  : "Konbini, restaurant, clinic, hotel — ready for real situations."
              }
            />
            <WhyCard
              icon={Trophy}
              title={isId ? "Pantau Kemajuan" : "Track Progress"}
              desc={
                isId
                  ? "Skor grammar, naturalness, confidence. Riwayat semua sesi tersimpan."
                  : "Grammar, naturalness, confidence scores. Full session history."
              }
            />
          </div>
        </section>

        {/* POPULAR SCENARIOS */}
        <section className="mb-24">
          <h2
            className="text-2xl sm:text-3xl font-black mb-8 inline-block pb-2"
            style={{ borderBottom: `4px solid ${INK}` }}
          >
            {isId ? "Skenario Populer" : "Popular Scenarios"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                to: "/interview" as const,
                icon: Briefcase,
                label: isId ? "Wawancara Kerja" : "Job Interview",
              },
              {
                to: "/hanashite/sc_konbini" as const,
                icon: Store,
                label: "Konbini",
              },
              {
                to: "/hanashite/sc_ramen" as const,
                icon: UtensilsCrossed,
                label: isId ? "Restoran" : "Restaurant",
              },
              {
                to: "/hanashite/sc_apato" as const,
                icon: Building2,
                label: isId ? "Apartemen" : "Apartment",
              },
              {
                to: "/hanashite/sc_clinic" as const,
                icon: Stethoscope,
                label: isId ? "Rumah Sakit" : "Hospital",
              },
            ].map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="p-4 flex flex-col items-center text-center hover:bg-[#F8FAFC] transition-colors"
                style={{ border: `2px solid ${INK}` }}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center mb-3"
                  style={{ border: `2px solid ${INK}`, background: "#F1F5F9" }}
                >
                  <Icon className="w-5 h-5" style={{ color: INK }} />
                </div>
                <span className="text-sm font-bold leading-snug">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mb-24 p-8 sm:p-12 text-white" style={{ background: INK }}>
          <h2 className="text-2xl sm:text-3xl font-black mb-10 uppercase tracking-wide">
            {isId ? "Cara Kerja" : "How It Works"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(isId
              ? [
                  "Pilih skenario interview atau situasi.",
                  "Latihan langsung dengan AI bahasa Jepang.",
                  "Dapat feedback grammar, naturalness, confidence.",
                  "Ulang sampai siap berangkat ke Jepang.",
                ]
              : [
                  "Pick an interview scenario or situation.",
                  "Practice directly with the AI in Japanese.",
                  "Get grammar, naturalness, confidence feedback.",
                  "Repeat until you're ready for Japan.",
                ]
            ).map((step, i) => (
              <div key={i}>
                <div
                  className="text-5xl font-black mb-4"
                  style={{ color: ACCENT }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="font-bold leading-snug">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section className="mb-24">
          <h2
            className="text-2xl sm:text-3xl font-black mb-3 text-center"
          >
            {isId ? "Harga" : "Pricing"}
          </h2>
          <p className="text-center mb-10 text-sm" style={{ color: INK_SOFT }}>
            {isId
              ? "Mulai gratis. Upgrade kapan saja."
              : "Start free. Upgrade any time."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            <PriceCard
              title="Free"
              price="$0"
              tagline={isId ? "selamanya" : "forever"}
              features={
                isId
                  ? [
                      "10 translator request / hari",
                      "2 sesi interview / hari",
                      "2 sesi simulasi / hari",
                      "Riwayat dasar",
                    ]
                  : [
                      "10 translator requests / day",
                      "2 interview sessions / day",
                      "2 life-sim sessions / day",
                      "Basic history",
                    ]
              }
            />
            <PriceCard
              title="Pro"
              price="$19"
              tagline={isId ? "sekali bayar — seumur hidup" : "one-time — lifetime"}
              features={
                isId
                  ? [
                      "Translator unlimited",
                      "Interview unlimited",
                      "Semua skenario terbuka",
                      "Riwayat & analitik lengkap",
                    ]
                  : [
                      "Unlimited translator",
                      "Unlimited interviews",
                      "All scenarios unlocked",
                      "Full history & analytics",
                    ]
              }
              accent
            />
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1 text-sm font-bold underline underline-offset-4"
              style={{ color: INK }}
            >
              {isId ? "Lihat detail harga" : "See full pricing"}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2
            className="text-2xl sm:text-3xl font-black mb-8 inline-block pb-2"
            style={{ borderBottom: `4px solid ${INK}` }}
          >
            FAQ
          </h2>
          <div className="space-y-4 max-w-3xl">
            {(isId
              ? [
                  {
                    q: "Apa bedanya dengan aplikasi belajar bahasa Jepang lain?",
                    a: "Fokus kami bukan grammar dari nol, tapi situasi nyata di Jepang: interview Tokutei Ginou, ngobrol dengan atasan, dan kehidupan sehari-hari. Cocok untuk yang sudah punya dasar (N5/N4).",
                  },
                  {
                    q: "Apakah suara saya direkam?",
                    a: "Tidak. Mic browser hanya untuk speech-to-text lokal. Transkrip teks dikirim ke AI untuk dievaluasi.",
                  },
                  {
                    q: "Apakah Pro berlangganan bulanan?",
                    a: "Tidak. Pro $19 sekali bayar, akses seumur hidup ke semua fitur sekarang & yang akan datang.",
                  },
                  {
                    q: "Skenario apa saja yang tersedia sekarang?",
                    a: "Interview Simulator: Tokutei Ginou, Staff Restoran. Life Simulator: konbini, restoran ramen, apartemen, klinik, izakaya, dan banyak lagi.",
                  },
                ]
              : [
                  {
                    q: "How is this different from other Japanese learning apps?",
                    a: "We don't teach grammar from scratch. We focus on real situations in Japan: Tokutei Ginou interviews, talking to bosses, daily life. Best if you already have N5/N4 basics.",
                  },
                  {
                    q: "Is my voice recorded?",
                    a: "No. The browser mic is used for local speech-to-text only. Only the text transcript is sent to the AI.",
                  },
                  {
                    q: "Is Pro a monthly subscription?",
                    a: "No. Pro is a one-time $19 payment for lifetime access to current and future features.",
                  },
                  {
                    q: "Which scenarios are available now?",
                    a: "Interview Simulator: Tokutei Ginou, Restaurant Staff. Life Simulator: konbini, ramen shop, apartment hunting, clinic, izakaya, and more.",
                  },
                ]
            ).map((f, i) => (
              <details
                key={i}
                className="group p-5"
                style={{ border: `2px solid ${INK}`, background: "white" }}
              >
                <summary className="cursor-pointer font-bold list-none flex items-center justify-between">
                  <span>{f.q}</span>
                  <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: INK_SOFT }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function WhyCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Sparkles;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="p-5"
      style={{ border: `2px solid ${INK}`, background: "white" }}
    >
      <div
        className="w-10 h-10 flex items-center justify-center mb-3"
        style={{ background: ACCENT }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-black text-base mb-1.5" style={{ color: INK }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: INK_SOFT }}>
        {desc}
      </p>
    </div>
  );
}

function PriceCard({
  title,
  price,
  tagline,
  features,
  accent,
}: {
  title: string;
  price: string;
  tagline: string;
  features: string[];
  accent?: boolean;
}) {
  return (
    <div
      className="p-6"
      style={{
        border: `${accent ? 4 : 2}px solid ${accent ? ACCENT : INK}`,
        background: "white",
      }}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-bold uppercase tracking-wider">{title}</div>
        {accent && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 text-white"
            style={{ background: ACCENT }}
          >
            Best
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-black">{price}</span>
        <span className="text-sm" style={{ color: INK_SOFT }}>
          {tagline}
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
