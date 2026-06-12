import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Mic, MessageCircle } from "lucide-react";
import { SCENARIOS } from "@/lib/hanashite-scenarios";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { SignInButton } from "@/components/SignInButton";

export const Route = createFileRoute("/hanashite")({
  head: () => ({
    meta: [
      { title: "Hanashite Room — Simulasi Bicara AI | NihongoLevel" },
      {
        name: "description",
        content:
          "Latih percakapan bahasa Jepang dengan AI dalam berbagai situasi — pesan ramen, meeting kantor, tanya arah. Dapat feedback grammar dan keigo instan.",
      },
      { property: "og:title", content: "Hanashite Room — Simulasi Bicara AI" },
      {
        property: "og:description",
        content: "Latih bicara bahasa Jepang dengan AI tanpa rasa malu. Skenario realistis + feedback langsung.",
      },
    ],
    links: [{ rel: "canonical", href: "/hanashite" }],
  }),
  component: HanashiteIndex,
});

function HanashiteIndex() {
  const { lang } = useT();
  const { user, profile } = useAuth();
  const isPro = !!profile?.is_pro;
  const isId = lang === "id";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
          <Mic className="w-3.5 h-3.5" />
          {isId ? "Fitur Baru" : "New Feature"}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          話してルーム <span className="text-primary">Hanashite Room</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
          {isId
            ? "Latih bicara bahasa Jepang dengan AI dalam situasi nyata. Tanpa rasa malu, dengan feedback grammar & keigo instan."
            : "Practice speaking Japanese with AI in real-life scenarios. Zero anxiety, instant grammar & keigo feedback."}
        </p>
      </header>

      {!user && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {isId
              ? "Masuk dulu untuk mulai berlatih bicara."
              : "Sign in to start practicing your speaking."}
          </p>
          <SignInButton />
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        {SCENARIOS.map((s) => {
          const locked = !s.free && !isPro;
          const title = isId ? s.title_id : s.title_en;
          const situation = isId ? s.situation_id : s.situation_en;
          const role = isId ? s.role_id : s.role_en;
          const tone = isId ? s.tone_id : s.tone_en;
          return (
            <div
              key={s.id}
              className="relative rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-3xl">{s.emoji}</div>
                {s.free ? (
                  <span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                    Free
                  </span>
                ) : (
                  <span className="rounded-full bg-yellow-400/20 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                    Pro
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground flex-1">{situation}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full bg-muted px-2 py-0.5">👤 {role}</span>
                <span className="rounded-full bg-muted px-2 py-0.5">🎯 {tone}</span>
              </div>

              <div className="mt-4">
                {locked ? (
                  <Link
                    to="/pricing"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
                  >
                    <Lock className="w-4 h-4" />
                    {isId ? "Upgrade ke Pro" : "Upgrade to Pro"}
                  </Link>
                ) : (
                  <Link
                    to="/hanashite/$scenarioId"
                    params={{ scenarioId: s.id }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition aria-disabled:opacity-50 aria-disabled:pointer-events-none"
                    aria-disabled={!user}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {isId ? "Mulai Berlatih" : "Start Practice"}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-10 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground/80">
          {isId ? "Cara Pakai" : "How it works"}
        </h2>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-semibold text-foreground">1.</span>{" "}
            {isId
              ? "Pilih skenario yang ingin kamu latih."
              : "Pick a scenario you want to practice."}
          </li>
          <li>
            <span className="font-semibold text-foreground">2.</span>{" "}
            {isId
              ? "Bicara langsung pakai mic (atau ketik) — AI akan membalas dalam bahasa Jepang."
              : "Speak with your mic (or type) — the AI replies in Japanese."}
          </li>
          <li>
            <span className="font-semibold text-foreground">3.</span>{" "}
            {isId
              ? "Klik tombol suara untuk dengar pengucapan AI."
              : "Tap the speaker to hear the AI's pronunciation."}
          </li>
          <li>
            <span className="font-semibold text-foreground">4.</span>{" "}
            {isId
              ? "Selesai sesi → dapat skor kesopanan + koreksi grammar."
              : "End session → get politeness score + grammar corrections."}
          </li>
        </ol>
      </section>
    </div>
  );
}
