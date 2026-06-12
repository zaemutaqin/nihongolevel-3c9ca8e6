import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Languages,
  Trophy,
  ChevronDown,
  MessageSquare,
  Sparkles,
  Building2,
  UtensilsCrossed,
  Stethoscope,
  Store,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { SignInButton } from "@/components/SignInButton";
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

const INK = "#0F172A";
const INK_SOFT = "#475569";
const ACCENT = "#DC2626";
const CREAM = "#F5F1E8";

function HomeIndex() {
  const { lang } = useT();
  const { user } = useAuth();
  const isId = lang === "id";

  return (
    <div className="w-full" style={{ background: CREAM, color: INK }}>
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-20">
        {/* HERO — editorial split with illustration */}
        <header className="mb-28 sm:mb-36 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-[0.24em] mb-6 pb-1"
              style={{ borderBottom: `2px solid ${ACCENT}`, color: ACCENT }}
            >
              {isId ? "AI Coach untuk Pekerja Indonesia" : "AI Coach for Workers"}
            </span>
            <h1 className="font-black leading-[1.02] mb-7 text-[44px] sm:text-[60px] lg:text-[76px] tracking-[-0.02em]">
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
              className="text-lg sm:text-xl leading-relaxed mb-9 max-w-xl"
              style={{ color: INK_SOFT }}
            >
              {isId
                ? "Latih wawancara kerja, percakapan dengan atasan, dan situasi sehari-hari di Jepang sebelum berangkat. Skenario realistis + feedback grammar & keigo instan."
                : "Practice interviews, workplace conversations, and real-life Japanese before moving to Japan. Realistic scenarios + instant grammar & keigo feedback."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/interview"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base sm:text-lg font-black text-white hover:opacity-90 transition"
                style={{ background: ACCENT }}
              >
                {isId ? "Coba Interview Simulator" : "Try Interview Simulator"}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/translate"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base sm:text-lg font-bold hover:bg-black/5 transition"
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
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: ACCENT }}>
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
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: ACCENT }}>
              {isId ? "Mulai Latihan" : "Start Practicing"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black leading-[1.05] tracking-tight">
              {isId ? "Skenario Populer" : "Popular Scenarios"}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-10">
            {[
              { to: "/interview" as const, icon: Briefcase, label: isId ? "Wawancara Kerja" : "Job Interview" },
              { to: "/hanashite/sc_konbini" as const, icon: Store, label: "Konbini" },
              { to: "/hanashite/sc_ramen" as const, icon: UtensilsCrossed, label: isId ? "Restoran" : "Restaurant" },
              { to: "/hanashite/sc_apato" as const, icon: Building2, label: isId ? "Apartemen" : "Apartment" },
              { to: "/hanashite/sc_clinic" as const, icon: Stethoscope, label: isId ? "Rumah Sakit" : "Hospital" },
            ].map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col items-center text-center"
              >
                <Icon
                  className="w-14 h-14 mb-4 transition-transform group-hover:scale-110"
                  style={{ color: INK }}
                  strokeWidth={1.5}
                />
                <span
                  className="text-base font-black leading-tight group-hover:underline underline-offset-4 decoration-2"
                  style={{ textDecorationColor: ACCENT }}
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

        {/* PRICING — high-contrast color blocking */}
        <section className="mb-28 sm:mb-36">
          <div className="text-center mb-12">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: ACCENT }}>
              {isId ? "Investasi" : "Investment"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
              {isId ? "Harga" : "Pricing"}
            </h2>
            <p className="text-base" style={{ color: INK_SOFT }}>
              {isId ? "Mulai gratis. Upgrade kapan saja." : "Start free. Upgrade any time."}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* FREE — minimal */}
            <div
              className="p-8 sm:p-10 flex flex-col"
              style={{ border: `1px solid ${INK}`, background: "transparent" }}
            >
              <div className="text-xs font-bold uppercase tracking-[0.24em] mb-6" style={{ color: INK_SOFT }}>
                Free
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-black tracking-tight">$0</span>
                <span className="text-sm" style={{ color: INK_SOFT }}>
                  {isId ? "selamanya" : "forever"}
                </span>
              </div>
              <p className="text-sm mb-8" style={{ color: INK_SOFT }}>
                {isId ? "Cocok untuk mencoba sebelum upgrade." : "Perfect for trying before you upgrade."}
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {(isId
                  ? ["10 translator request / hari", "2 sesi interview / hari", "2 sesi simulasi / hari", "Riwayat dasar"]
                  : ["10 translator requests / day", "2 interview sessions / day", "2 life-sim sessions / day", "Basic history"]
                ).map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: INK }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/translate"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold hover:bg-black/5 transition"
                style={{ border: `1px solid ${INK}`, color: INK }}
              >
                {isId ? "Mulai Gratis" : "Start Free"}
              </Link>
            </div>

            {/* PRO — dominant red color block */}
            <div
              className="p-8 sm:p-10 flex flex-col relative"
              style={{ background: ACCENT, color: CREAM }}
            >
              <div
                className="absolute top-0 right-0 text-[10px] font-black uppercase tracking-[0.24em] px-3 py-1.5"
                style={{ background: INK, color: CREAM }}
              >
                Lifetime Access
              </div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] mb-6 opacity-90">
                Pro
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-black tracking-tight">$19</span>
                <span className="text-sm opacity-90">
                  {isId ? "sekali bayar" : "one-time"}
                </span>
              </div>
              <p className="text-sm mb-8 opacity-90">
                {isId ? "Bayar sekali, akses semua fitur selamanya." : "Pay once, unlock everything forever."}
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {(isId
                  ? ["Translator unlimited", "Interview unlimited", "Semua skenario terbuka", "Riwayat & analitik lengkap"]
                  : ["Unlimited translator", "Unlimited interviews", "All scenarios unlocked", "Full history & analytics"]
                ).map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: CREAM }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-black hover:opacity-90 transition"
                style={{ background: CREAM, color: ACCENT }}
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
    <div>
      <Icon className="w-12 h-12 mb-5" style={{ color: ACCENT }} strokeWidth={1.5} />
      <h3 className="font-black text-xl mb-2 tracking-tight" style={{ color: INK }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: INK_SOFT }}>
        {desc}
      </p>
    </div>
  );
}
