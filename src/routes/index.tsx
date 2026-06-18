import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Languages,
  Briefcase,
  TrendingUp,
  PlayCircle,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NihongoLevel — Siap Kerja & Hidup di Jepang dengan AI" },
      {
        name: "description",
        content:
          "Dari nol sampai siap interview kerja di Jepang. Kurikulum bertahap, latihan AI, dan translator natural dalam satu aplikasi.",
      },
      { property: "og:title", content: "NihongoLevel — Siap Kerja & Hidup di Jepang dengan AI" },
      {
        property: "og:description",
        content:
          "Dari nol sampai siap interview kerja di Jepang. Kurikulum bertahap, latihan AI, translator natural.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomeIndex,
});

function HomeIndex() {
  const { lang } = useT();
  const isId = lang === "id";
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const pillars = [
    {
      Icon: Sparkles,
      title: isId ? "Dari nol" : "From zero",
      desc: isId
        ? "Mulai dari hiragana, katakana, kosakata harian. Tidak perlu pengalaman sebelumnya."
        : "Start with hiragana, katakana, daily vocab. No prior experience needed.",
    },
    {
      Icon: Languages,
      title: "Translator",
      desc: isId
        ? "Empat gaya bahasa natural: santai, sopan, kerja, keigo. Bukan terjemahan kaku."
        : "Four natural styles: casual, polite, workplace, keigo. Never stiff.",
    },
    {
      Icon: Briefcase,
      title: "Interview AI",
      desc: isId
        ? "Latihan wawancara untuk 20 bidang kerja — dari pabrik sampai perhotelan."
        : "Interview practice for 20 work fields — factory to hospitality.",
    },
    {
      Icon: TrendingUp,
      title: "Progress",
      desc: isId
        ? "Pantau level kamu di tiap tahap. Tahu persis kapan kamu siap berangkat."
        : "Track your level at every stage. Know exactly when you're ready to go.",
    },
  ];

  return (
    <div className="w-full bg-background text-foreground">
      {/* HERO */}
      <section className="relative bg-violet-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] mb-6 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
              {isId ? "AI Coach Bahasa Jepang" : "Japanese AI Coach"}
            </span>

            <h1 className="font-black leading-[1.05] tracking-[-0.02em] text-[40px] sm:text-[56px] lg:text-[64px] text-violet-900 mb-6">
              {isId ? (
                <>
                  Siap kerja & hidup di Jepang dengan{" "}
                  <span className="inline-block px-2.5 rounded-md bg-lime-400 text-violet-900">AI</span>
                </>
              ) : (
                <>
                  Ready to work & live in Japan with{" "}
                  <span className="inline-block px-2.5 rounded-md bg-lime-400 text-violet-900">AI</span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-mutedink max-w-xl mb-10">
              {isId
                ? "Dari nol sampai siap interview kerja. Kurikulum bertahap, latihan dengan AI, dan translator natural — semua dalam satu tempat."
                : "From zero to interview-ready. A step-by-step curriculum, AI practice, and a natural translator — all in one place."}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Button
                size="lg"
                onClick={() => setOnboardingOpen(true)}
                className="h-12 px-7 rounded-full text-base font-bold shadow-md"
              >
                {isId ? "Mulai belajar gratis" : "Start learning free"}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                asChild
                className="h-12 px-5 rounded-full text-sm font-semibold text-violet-700"
              >
                <a href="#cara-kerja">
                  <PlayCircle className="w-4 h-4" />
                  {isId ? "Lihat cara kerja" : "See how it works"}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOUR PILLARS */}
      <section id="cara-kerja" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-2xl mb-12">
          <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-3 text-violet-600">
            {isId ? "Empat Pilar" : "Four Pillars"}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight text-violet-900">
            {isId ? "Satu aplikasi, jalan lengkap" : "One app, the full path"}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-mutedink">
            {isId
              ? "Bukan sekadar belajar kosakata — kamu dibimbing langkah demi langkah sampai siap bicara dengan orang Jepang sungguhan."
              : "Not just vocabulary drills — you're guided step by step until you can hold a real conversation in Japanese."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-hairline bg-card p-6 hover:border-violet-300 hover:shadow-sm transition"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-5">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-violet-900 mb-2">{title}</h3>
              <p className="text-sm leading-relaxed text-mutedink">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Onboarding modal — placeholder, logic comes in next step */}
      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-violet-900">
              {isId ? "Onboarding" : "Onboarding"}
            </DialogTitle>
            <DialogDescription>
              {isId
                ? "Alur onboarding akan diisi di tahap berikutnya."
                : "The onboarding flow will be wired up in the next step."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-violet-50 border border-dashed border-violet-300 p-6 text-sm text-violet-700">
            {isId
              ? "Placeholder — belum ada konten."
              : "Placeholder — no content yet."}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
