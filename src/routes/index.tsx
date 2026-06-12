import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Languages,
  Trophy,
  ChevronDown,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

import heroIllustration from "@/assets/hero-illustration.png";

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

const INK = "#2A1A1E";
const INK_SOFT = "#5C4A4F";
const ACCENT = "#D9F26B";
const LAVENDER = "#E8D5F2";
const CREAM = "#F2EDE4";

function HomeIndex() {
  const { lang } = useT();
  const { user } = useAuth();
  const isId = lang === "id";

  return (
    <div className="w-full" style={{ background: CREAM, color: INK }}>
      <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-16">
        {/* HERO — editorial split with illustration */}
        <header className="mb-24 sm:mb-32 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-12 items-center">
          <div>
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-[0.24em] mb-5 px-3.5 py-1.5 rounded-full"
              style={{ background: ACCENT, color: INK }}
            >
              {isId ? "AI Coach untuk Pekerja Indonesia" : "AI Coach for Workers"}
            </span>
            <h1 className="font-black leading-[1.05] mb-6 text-[40px] sm:text-[52px] lg:text-[56px] tracking-[-0.02em]">
              {isId ? (
                <>
                  Siap Kerja & Hidup
                  <br />
                  di Jepang dengan{" "}
                  <span className="px-2 rounded-md" style={{ background: ACCENT, color: INK }}>AI</span>
                </>
              ) : (
                <>
                  Prepare for Work & Life
                  <br />
                  in Japan with <span className="px-2 rounded-md" style={{ background: ACCENT, color: INK }}>AI</span>
                </>
              )}
            </h1>
            <p
              className="text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
              style={{ color: INK_SOFT }}
            >
              {isId
                ? "Latih wawancara kerja, percakapan dengan atasan, dan situasi sehari-hari di Jepang sebelum berangkat. Skenario realistis + feedback grammar & keigo instan."
                : "Practice interviews, workplace conversations, and real-life Japanese before moving to Japan. Realistic scenarios + instant grammar & keigo feedback."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/interview"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-bold hover:opacity-90 transition"
                style={{ background: INK, color: "#fff" }}
              >
                {isId ? "Coba Interview Simulator" : "Try Interview Simulator"}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/translate"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-bold hover:bg-black/5 transition"
                style={{ color: INK }}
              >
                {isId ? "Mulai Gratis" : "Start Free"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

          {/* Right: single flat illustration */}
          <div className="hidden lg:block">
            <img
              src={heroIllustration}
              alt={isId ? "Ilustrasi pekerja Indonesia belajar bahasa Jepang" : "Indonesian worker learning Japanese"}
              width={1024}
              height={1024}
              className="w-full h-auto"
            />
          </div>
        </header>

        {/* WHY NIHONGOLEVEL — borderless editorial */}
        <section className="mb-28 sm:mb-36">
          <div className="mb-12 max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: INK }}>
              {isId ? "Empat Pilar" : "Four Pillars"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black leading-[1.05] tracking-tight">
              {isId ? "Kenapa NihongoLevel" : "Why NihongoLevel"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
            <WhyItem
              icon={Languages}
              title={isId ? "Translator Natural" : "Natural Translator"}
              desc={isId ? "4 level: Casual, Polite, Workplace, Keigo. Bukan terjemahan kaku." : "4 levels: Casual, Polite, Workplace, Keigo. Not stiff translation."}
            />
            <WhyItem
              icon={Briefcase}
              title={isId ? "Latihan Interview" : "Interview Practice"}
              desc={isId ? "AI berperan jadi pewawancara Jepang. Tanpa rasa malu." : "AI plays the Japanese interviewer. Zero anxiety."}
            />
            <WhyItem
              icon={MessageSquare}
              title={isId ? "Simulasi Nyata" : "Real-Life Sim"}
              desc={isId ? "Konbini, restoran, klinik, hotel — siap menghadapi situasi nyata." : "Konbini, restaurant, clinic, hotel — ready for real situations."}
            />
            <WhyItem
              icon={Trophy}
              title={isId ? "Pantau Kemajuan" : "Track Progress"}
              desc={isId ? "Skor grammar, naturalness, confidence. Riwayat semua sesi tersimpan." : "Grammar, naturalness, confidence scores. Full session history."}
            />
          </div>
        </section>

        {/* POPULAR SCENARIOS — borderless */}
        <section className="mb-28 sm:mb-36">
          <div className="mb-12 max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: INK }}>
              {isId ? "Mulai Latihan" : "Start Practicing"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black leading-[1.05] tracking-tight">
              {isId ? "Skenario Populer" : "Popular Scenarios"}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { to: "/interview" as const, emoji: "💼", label: isId ? "Wawancara Kerja" : "Job Interview" },
              { to: "/hanashite/sc_konbini" as const, emoji: "🏪", label: "Konbini" },
              { to: "/hanashite/sc_ramen" as const, emoji: "🍜", label: isId ? "Restoran" : "Restaurant" },
              { to: "/hanashite/sc_apato" as const, emoji: "🏠", label: isId ? "Apartemen" : "Apartment" },
              { to: "/hanashite/sc_clinic" as const, emoji: "🏥", label: isId ? "Rumah Sakit" : "Hospital" },
            ].map(({ to, emoji, label }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col items-center justify-center text-center bg-white rounded-2xl py-8 px-4 hover:-translate-y-1 transition-transform"
                style={{ border: `1px solid rgba(15,23,42,0.08)` }}
              >
                <span className="text-4xl mb-4" aria-hidden>
                  {emoji}
                </span>
                <span
                  className="text-sm font-bold leading-tight"
                  style={{ color: INK }}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS — dark navy with massive red numerals */}
        <section
          className="mb-28 sm:mb-36 px-8 sm:px-14 py-14 sm:py-20 text-white"
          style={{ background: INK }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: ACCENT }}>
            {isId ? "Proses" : "Process"}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black mb-14 tracking-tight">
            {isId ? "Cara Kerja" : "How It Works"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-14">
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
                  className="font-black leading-none mb-5 tracking-[-0.04em]"
                  style={{ color: ACCENT, fontSize: "clamp(64px, 8vw, 96px)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="font-bold leading-snug text-lg">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING — colored cards with numerals */}
        <section className="mb-28 sm:mb-36">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-8">
            {isId ? "Harga" : "Pricing"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* FREE */}
            <div
              className="rounded-3xl p-6 sm:p-7 flex flex-col relative overflow-hidden"
              style={{ background: "#E8D5F2" }}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl sm:text-3xl font-black leading-tight max-w-[60%]" style={{ color: INK }}>
                  Free
                </h3>
                <span className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: INK }}>
                  01
                </span>
              </div>
              <div className="text-sm mb-3" style={{ color: INK_SOFT }}>
                {isId ? "selamanya" : "forever"}
              </div>
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: INK }}>$0</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {(isId
                  ? ["10 translator request / hari", "2 sesi interview / hari", "2 sesi simulasi / hari", "Riwayat dasar"]
                  : ["10 translator requests / day", "2 interview sessions / day", "2 life-sim sessions / day", "Basic history"]
                ).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: INK }}>
                    <span className="mt-0.5 flex-shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/translate"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition"
                style={{ background: INK }}
              >
                {isId ? "Mulai Gratis" : "Start Free"}
              </Link>
            </div>

            {/* PRO */}
            <div
              className="rounded-3xl p-6 sm:p-7 flex flex-col relative overflow-hidden"
              style={{ background: "#D9F26B" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="max-w-[60%]">
                  <h3 className="text-2xl sm:text-3xl font-black leading-tight" style={{ color: INK }}>
                    Pro
                  </h3>
                  <div className="text-sm mt-1" style={{ color: INK_SOFT }}>
                    Lifetime Access
                  </div>
                </div>
                <span className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: INK }}>
                  02
                </span>
              </div>
              <div className="text-sm mb-3" style={{ color: INK_SOFT }}>
                {isId ? "sekali bayar" : "one-time"}
              </div>
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: INK }}>$19</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {(isId
                  ? ["Translator unlimited", "Interview unlimited", "Semua skenario terbuka", "Riwayat & analitik lengkap"]
                  : ["Unlimited translator", "Unlimited interviews", "All scenarios unlocked", "Full history & analytics"]
                ).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: INK }}>
                    <span className="mt-0.5 flex-shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition"
                style={{ background: INK }}
              >
                {isId ? "Upgrade ke Pro" : "Upgrade to Pro"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>


        {/* FAQ — minimal bottom-border list */}
        <section className="mb-16 max-w-3xl">
          <div className="mb-10">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: ACCENT }}>
              {isId ? "Pertanyaan" : "Questions"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">FAQ</h2>
          </div>
          <div style={{ borderTop: `1px solid ${INK}` }}>
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
              <details key={i} className="group py-6" style={{ borderBottom: `1px solid ${INK}` }}>
                <summary className="cursor-pointer list-none flex items-center justify-between gap-6">
                  <span className="font-bold text-lg leading-snug">{f.q}</span>
                  <ChevronDown className="w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-base leading-relaxed" style={{ color: INK_SOFT }}>
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

function WhyItem({
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
      className="p-7 rounded-2xl bg-white"
      style={{ border: `1px solid rgba(15,23,42,0.08)` }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
        style={{ background: ACCENT }}
      >
        <Icon className="w-5 h-5" style={{ color: INK }} strokeWidth={2} />
      </div>
      <h3 className="font-black text-xl mb-2 tracking-tight" style={{ color: INK }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: INK_SOFT }}>
        {desc}
      </p>
    </div>
  );
}
