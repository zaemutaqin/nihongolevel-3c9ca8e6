import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Lock,
  MessageCircle,
  ArrowRight,
  UtensilsCrossed,
  Briefcase,
  Map as MapIcon,
  Sparkles,
} from "lucide-react";
import { SCENARIOS } from "@/lib/hanashite-scenarios";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { SignInButton } from "@/components/SignInButton";
import heroIllustration from "@/assets/hero-hanashite.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NihongoLevel — Latih Bicara Bahasa Jepang dengan AI" },
      {
        name: "description",
        content:
          "Latih percakapan bahasa Jepang dengan AI dalam berbagai situasi — pesan ramen, meeting kantor, tanya arah. Dapat feedback grammar dan keigo instan.",
      },
      { property: "og:title", content: "NihongoLevel — Latih Bicara Bahasa Jepang dengan AI" },
      {
        property: "og:description",
        content:
          "Latih bicara bahasa Jepang dengan AI tanpa rasa malu. Skenario realistis + feedback langsung.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomeIndex,
});

// Flat design tokens — slate/navy ink for softer contrast than pure black
const INK = "#0F172A"; // dark slate (instead of #000)
const INK_SOFT = "#334155"; // body text
const ACCENT = "#22C55E";

// Map scenario id -> lucide icon (replaces generic emoji)
const SCENARIO_ICONS: Record<string, typeof UtensilsCrossed> = {
  sc_ramen: UtensilsCrossed,
  sc_meeting: Briefcase,
  sc_directions: MapIcon,
};

function HomeIndex() {
  const { lang } = useT();
  const { user, profile } = useAuth();
  const isPro = !!profile?.is_pro;
  const isId = lang === "id";

  return (
    <div className="w-full bg-white" style={{ color: INK }}>
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
        {/* HERO — F-pattern + illustration on right */}
        <header className="mb-20 sm:mb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-12 items-center">
          <div>
            <span
              className="inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] mb-5"
              style={{ border: `2px solid ${INK}`, color: INK }}
            >
              {isId ? "Fitur Utama" : "Main Feature"}
            </span>
            <h1
              className="font-black leading-[1.05] mb-6 text-[40px] sm:text-[56px] lg:text-[72px]"
              style={{ fontFamily: "'Noto Sans JP', system-ui, sans-serif" }}
            >
              話してルーム
              <br />
              Hanashite Room
            </h1>
            <p className="text-lg sm:text-xl leading-relaxed mb-8 max-w-2xl" style={{ color: INK_SOFT }}>
              {isId
                ? "Latih bicara bahasa Jepang dengan AI dalam situasi nyata. Tanpa rasa malu, dengan feedback grammar & keigo instan."
                : "Practice speaking Japanese with AI in real-life scenarios. Zero anxiety, instant grammar & keigo feedback."}
            </p>

            {user ? (
              <a
                href="#skenario"
                className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-black text-white hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                style={{ background: ACCENT, border: `4px solid ${INK}` }}
              >
                {isId ? "MULAI BERLATIH SEKARANG" : "START PRACTICING NOW"}
                <ArrowRight className="w-5 h-5" />
              </a>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <SignInButton />
                <span className="text-sm" style={{ color: INK_SOFT }}>
                  {isId ? "Masuk dulu untuk mulai berlatih." : "Sign in to start practicing."}
                </span>
              </div>
            )}
          </div>

          {/* Right: hero illustration */}
          <div className="hidden lg:flex items-center justify-center">
            <img
              src={heroIllustration}
              alt={
                isId
                  ? "Ilustrasi orang berbincang dengan AI dalam bahasa Jepang"
                  : "Illustration of a person chatting with an AI in Japanese"
              }
              width={520}
              height={520}
              className="w-full max-w-[520px] h-auto"
            />
          </div>
        </header>

        {/* SKENARIO GRID */}
        <section id="skenario" className="mb-24">
          <h2
            className="text-2xl sm:text-3xl font-black mb-8 inline-block pb-2"
            style={{ borderBottom: `4px solid ${INK}`, color: INK }}
          >
            {isId ? "Pilih Skenario" : "Choose a Scenario"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SCENARIOS.map((s) => {
              const locked = !s.free && !isPro;
              const title = isId ? s.title_id : s.title_en;
              const situation = isId ? s.situation_id : s.situation_en;
              const role = isId ? s.role_id : s.role_en;
              const tone = isId ? s.tone_id : s.tone_en;
              const Icon = SCENARIO_ICONS[s.id] ?? Sparkles;
              return (
                <article
                  key={s.id}
                  className="p-6 flex flex-col bg-white"
                  style={{ border: `2px solid ${INK}` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 flex items-center justify-center"
                      style={{ border: `2px solid ${INK}`, background: "#F1F5F9" }}
                    >
                      <Icon className="w-6 h-6" style={{ color: INK }} />
                    </div>
                    <span
                      className="px-2 py-1 text-[10px] font-black uppercase tracking-wider"
                      style={
                        s.free
                          ? { background: ACCENT, color: "white" }
                          : { background: INK, color: "white" }
                      }
                    >
                      {s.free ? "Free" : "Pro"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: INK }}>
                    {title}
                  </h3>
                  <p className="text-sm mb-5 flex-1" style={{ color: INK_SOFT }}>
                    {situation}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span
                      className="px-2 py-1 text-[10px] font-bold"
                      style={{ background: "#F1F5F9", color: INK }}
                    >
                      👤 {role}
                    </span>
                    <span
                      className="px-2 py-1 text-[10px] font-bold"
                      style={{ background: "#F1F5F9", color: INK }}
                    >
                      🎯 {tone}
                    </span>
                  </div>
                  {locked ? (
                    <Link
                      to="/pricing"
                      className="inline-flex w-full items-center justify-center gap-2 py-3 text-sm font-bold hover:bg-[#F8FAFC] transition-colors"
                      style={{ border: `2px solid ${INK}`, color: INK }}
                    >
                      <Lock className="w-4 h-4" />
                      {isId ? "Upgrade ke Pro" : "Upgrade to Pro"}
                    </Link>
                  ) : (
                    <Link
                      to="/hanashite/$scenarioId"
                      params={{ scenarioId: s.id }}
                      className="inline-flex w-full items-center justify-center gap-2 py-3 text-sm font-bold hover:bg-[#F8FAFC] transition-colors aria-disabled:opacity-50 aria-disabled:pointer-events-none"
                      style={{ border: `2px solid ${INK}`, color: INK }}
                      aria-disabled={!user}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {isId ? "Mulai Berlatih" : "Start Practice"}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* CARA PAKAI — Dark band */}
        <section className="mb-24 p-8 sm:p-12 text-white" style={{ background: INK }}>
          <h2 className="text-2xl sm:text-3xl font-black mb-10 uppercase tracking-wide">
            {isId ? "Cara Pakai" : "How It Works"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(isId
              ? [
                  "Pilih skenario yang ingin kamu latih.",
                  "Bicara langsung pakai mic (atau ketik).",
                  "AI membalas dalam bahasa Jepang.",
                  "Dapatkan skor kesopanan & koreksi.",
                ]
              : [
                  "Pick a scenario you want to practice.",
                  "Speak with your mic (or type).",
                  "The AI replies in Japanese.",
                  "Get politeness score & corrections.",
                ]
            ).map((step, i) => (
              <div key={i}>
                <div className="text-5xl font-black mb-4" style={{ color: ACCENT }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="font-bold leading-snug">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FITUR LAINNYA */}
        <section>
          <h2
            className="text-2xl sm:text-3xl font-black mb-8 inline-block pb-2"
            style={{ borderBottom: `4px solid ${INK}`, color: INK }}
          >
            {isId ? "Fitur Lainnya" : "More Tools"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              to="/nama-jepang"
              tint="#ECFDF5"
              title={isId ? "Generator Nama Jepang" : "Japanese Name Generator"}
              desc={
                isId
                  ? "Ubah namamu ke Katakana, dapat saran Kanji bermakna, download kartu Meishi."
                  : "Convert your name to Katakana, get meaningful Kanji, download a Meishi card."
              }
            />
            <FeatureCard
              to="/kamus-slang"
              tint="#EFF6FF"
              title={isId ? "Kamus Slang Jepang" : "Japanese Slang Dictionary"}
              desc={
                isId
                  ? "Arti yabai, sugoi, kawaii, tsundere, dan puluhan kata gaul lainnya."
                  : "Meanings of yabai, sugoi, kawaii, tsundere, and dozens more."
              }
            />
            <FeatureCard
              to="/game-kana"
              tint="#FEF3C7"
              title="Kana Speed Drop"
              desc={
                isId
                  ? "Hafalkan Hiragana lewat mini-game ketik-cepat dengan high score."
                  : "Memorize Hiragana via a speed-typing mini-game with high scores."
              }
            />
            <FeatureCard
              to="/translate"
              tint="#FCE7F3"
              title={isId ? "Translator Ekspresi Natural" : "Natural Expression Translator"}
              desc={
                isId
                  ? "Terjemahkan kalimat sehari-hari dengan level kesopanan & konteks sosial."
                  : "Translate everyday phrases with politeness levels and social context."
              }
            />
            <FeatureCard
              to="/tabel-hiragana"
              tint="#F1F5F9"
              title={isId ? "Tabel Hiragana Lengkap" : "Complete Hiragana Chart"}
              desc={
                isId
                  ? "Referensi interaktif 71+ huruf hiragana dengan romaji dan audio."
                  : "Interactive reference for 71+ hiragana characters with romaji and audio."
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  to,
  title,
  desc,
  tint,
}: {
  to: "/nama-jepang" | "/kamus-slang" | "/game-kana" | "/translate" | "/tabel-hiragana";
  title: string;
  desc: string;
  tint: string;
}) {
  return (
    <Link
      to={to}
      className="group relative block p-6 transition-colors hover:brightness-[0.97]"
      style={{ border: `2px solid ${INK}`, background: tint }}
    >
      <h3 className="font-black text-lg mb-2 pr-8" style={{ color: INK }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: INK_SOFT }}>
        {desc}
      </p>
      <ArrowRight
        className="w-5 h-5 absolute bottom-5 right-5 transition-transform group-hover:translate-x-1"
        style={{ color: INK }}
      />
    </Link>
  );
}
