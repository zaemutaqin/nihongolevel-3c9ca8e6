import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  ArrowRight,
  Sparkles,
  Languages,
  Briefcase,
  TrendingUp,
  PlayCircle,
  Check,
  CheckCircle2,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const searchSchema = z.object({
  onboarding: fallback(z.coerce.number().int().min(0).max(1), 0).default(0),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
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

type Location = "id" | "jp";
type Level = "none" | "some" | "basic";

const ONBOARDING_DONE_KEY = "nihongolevel_onboarding_done";
const STARTING_LEVEL_KEY = "nihongolevel_starting_level";

function HomeIndex() {
  const { lang } = useT();
  const isId = lang === "id";
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const router = useRouter();

  const onboardingDone =
    typeof window !== "undefined" &&
    window.localStorage.getItem(ONBOARDING_DONE_KEY) === "true";

  const open = search.onboarding === 1 && !onboardingDone;

  const setOpen = (v: boolean) => {
    if (v && onboardingDone) {
      const stored =
        (typeof window !== "undefined" &&
          window.localStorage.getItem(STARTING_LEVEL_KEY)) ||
        "level-0";
      router.navigate({ to: "/belajar/level/$levelId", params: { levelId: stored } });
      return;
    }
    if (v) navigate({ search: { onboarding: 1 } });
    else navigate({ search: { onboarding: 0 } });
  };

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
    <div className={cn("w-full bg-background text-foreground transition", open && "blur-sm")}
         aria-hidden={open}
    >
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
                onClick={() => setOpen(true)}
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

      <OnboardingModal
        open={open}
        onOpenChange={setOpen}
        isId={isId}
        onFinish={async (loc, level) => {
          const levelId =
            level === "none" ? "level-0" : level === "some" ? "level-1" : "level-2";
          const target = `/belajar/${levelId}`;

          // Persist onboarding if signed in (best-effort)
          try {
            const { data: sess } = await supabase.auth.getSession();
            const uid = sess.session?.user?.id;
            if (uid) {
              const { error } = await supabase
                .from("profiles")
                .update({
                  onboarding_location: loc === "id" ? "indonesia" : "japan",
                  onboarding_level:
                    level === "none" ? "zero" : level === "some" ? "basic" : "n4n3",
                  current_level_id: levelId,
                })
                .eq("id", uid);
              if (error) throw error;
            }
          } catch (e) {
            console.warn("[onboarding] save failed", e);
            toast.error(isId ? "Gagal menyimpan, tetap dilanjutkan." : "Save failed, continuing.");
          }

          navigate({ search: { onboarding: 0 } });
          router.navigate({ to: target });
        }}
      />
    </div>
  );
}

function OnboardingModal({
  open,
  onOpenChange,
  isId,
  onFinish,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isId: boolean;
  onFinish: (location: Location, level: Level) => void;
}) {
  const [step, setStep] = useState(0); // 0, 1, 2 (result)
  const [location, setLocation] = useState<Location | null>(null);
  const [level, setLevel] = useState<Level | null>(null);

  // Reset when closed
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setTimeout(() => {
        setStep(0);
        setLocation(null);
        setLevel(null);
      }, 200);
    }
    onOpenChange(v);
  };

  const recommendation = useMemo(() => {
    if (level === "none")
      return {
        code: "Level 0",
        title: isId ? "Fondasi mutlak" : "Absolute foundation",
        desc: isId
          ? "Hiragana, katakana, dan kata-kata pertama untuk memulai."
          : "Hiragana, katakana, and your first words to get started.",
      };
    if (level === "some")
      return {
        code: "Level 1",
        title: isId ? "Kehidupan sehari-hari" : "Daily life",
        desc: isId
          ? "Belanja, transportasi, makan di luar, percakapan ringan."
          : "Shopping, transport, eating out, small talk.",
      };
    return {
      code: "Level 2",
      title: isId ? "Bahasa tempat kerja" : "Workplace Japanese",
      desc: isId
        ? "Bicara sopan dengan atasan dan rekan kerja, situasi kantor & pabrik."
        : "Polite talk with bosses and coworkers, office & factory scenarios.",
    };
  }, [level, isId]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border-violet-100">
        {/* Progress dots */}
        <div className="px-6 pt-6 pb-2 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition",
                i <= step ? "bg-violet-600" : "bg-violet-100",
              )}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="px-6 pb-6 pt-2">
            <DialogHeader>
              <DialogTitle className="text-xl text-violet-900">
                {isId ? "Kamu sekarang ada di mana?" : "Where are you right now?"}
              </DialogTitle>
              <DialogDescription>
                {isId
                  ? "Ini membantu menyesuaikan materi yang paling relevan."
                  : "Helps us tailor the most relevant material."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid gap-3">
              <ChoiceCard
                selected={location === "id"}
                onClick={() => setLocation("id")}
                title={isId ? "Masih di Indonesia" : "Still in Indonesia"}
                sub={isId ? "Sedang persiapan keberangkatan" : "Preparing to depart"}
              />
              <ChoiceCard
                selected={location === "jp"}
                onClick={() => setLocation("jp")}
                title={isId ? "Sudah di Jepang" : "Already in Japan"}
                sub={isId ? "Sudah bekerja atau baru tiba" : "Working or just arrived"}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                disabled={!location}
                onClick={() => setStep(1)}
                className="rounded-full px-6"
              >
                {isId ? "Lanjut" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="px-6 pb-6 pt-2">
            <DialogHeader>
              <DialogTitle className="text-xl text-violet-900">
                {isId ? "Seberapa jauh bahasa Jepangmu?" : "How far is your Japanese?"}
              </DialogTitle>
              <DialogDescription>
                {isId
                  ? "Jujur saja — tidak ada jawaban yang salah."
                  : "Be honest — there is no wrong answer."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid gap-3">
              <ChoiceCard
                selected={level === "none"}
                onClick={() => setLevel("none")}
                title={isId ? "Belum tahu sama sekali" : "Nothing yet"}
                sub={isId ? "Hiragana pun belum kenal" : "Don't know hiragana yet"}
              />
              <ChoiceCard
                selected={level === "some"}
                onClick={() => setLevel("some")}
                title={isId ? "Tahu sedikit" : "I know a little"}
                sub={isId ? "Bisa baca hiragana, tahu beberapa kata" : "Can read hiragana, know some words"}
              />
              <ChoiceCard
                selected={level === "basic"}
                onClick={() => setLevel("basic")}
                title={isId ? "Sudah bisa percakapan dasar" : "Basic conversation"}
                sub={isId ? "Sekitar level N4-N3" : "Roughly N4-N3"}
              />
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)} className="rounded-full">
                {isId ? "Kembali" : "Back"}
              </Button>
              <Button
                disabled={!level}
                onClick={() => setStep(2)}
                className="rounded-full px-6"
              >
                {isId ? "Lihat hasil" : "See result"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && level && (
          <div className="px-6 pb-6 pt-2">
            <DialogHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-lime-400 text-violet-900 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <DialogTitle className="text-2xl text-violet-900 text-center">
                {isId ? "Jalur belajarmu sudah siap" : "Your learning path is ready"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {isId
                  ? "Rekomendasi berdasarkan jawabanmu."
                  : "Recommended based on your answers."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600 mb-1">
                {recommendation.code}
              </div>
              <div className="text-lg font-bold text-violet-900 mb-1">
                {recommendation.title}
              </div>
              <p className="text-sm text-mutedink">{recommendation.desc}</p>
            </div>

            <Button
              onClick={() => onFinish(location!, level)}
              className="mt-6 w-full h-12 rounded-full text-base font-bold bg-lime-500 text-violet-900 hover:bg-lime-600 shadow-md"
            >
              {isId ? "Mulai sesi pertama sekarang" : "Start your first session now"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChoiceCard({
  selected,
  onClick,
  title,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-xl border p-4 transition flex items-start gap-3 cursor-pointer",
        selected
          ? "border-violet-600 bg-violet-50 ring-2 ring-violet-600/20"
          : "border-hairline bg-background hover:border-violet-300 hover:bg-violet-50/50",
      )}
    >
      <div
        className={cn(
          "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition",
          selected ? "border-violet-600 bg-violet-600 text-white" : "border-hairline",
        )}
      >
        {selected && <Check className="w-3 h-3" strokeWidth={3} />}
      </div>
      <div className="flex-1">
        <div className={cn("font-semibold", selected ? "text-violet-900" : "text-foreground")}>
          {title}
        </div>
        <div className="text-xs text-mutedink mt-0.5">{sub}</div>
      </div>
    </button>
  );
}
