import { useState } from "react";
import { Sparkles, History, MessageCircle, Loader2, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { lovable } from "@/integrations/lovable";
import { useT, setLang, useLang, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SiteFooter } from "./SiteFooter";

function LangToggle() {
  const lang = useLang();
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5 text-xs font-semibold">
      {(["id", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "px-2 py-0.5 rounded-full transition",
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}
        </button>
      ))}
    </div>
  );
}

export function Landing() {
  const { t, lang } = useT();
  const [signingIn, setSigningIn] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleGoogle = async () => {
    setSigningIn(true);
    setErr(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setErr(result.error.message || "Failed to sign in");
        setSigningIn(false);
      }
      // If redirected: nothing to do
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to sign in");
      setSigningIn(false);
    }
  };

  const features = lang === "id"
    ? [
        { icon: Sparkles, title: "Ekspresi natural", desc: "Yang benar-benar diucapkan orang Jepang, bukan terjemahan kaku." },
        { icon: History, title: "Riwayat pribadi", desc: "Semua pencarianmu tersimpan dan tersinkron di semua perangkat." },
        { icon: MessageCircle, title: "Latihan situasi", desc: "Ulang ekspresi favorit dengan latihan harian yang dipersonalisasi." },
      ]
    : [
        { icon: Sparkles, title: "Natural expressions", desc: "What Japanese people actually say — not stiff textbook translations." },
        { icon: History, title: "Personal history", desc: "All your searches saved and synced across every device." },
        { icon: MessageCircle, title: "Situation practice", desc: "Review your favorite expressions with personalized daily practice." },
      ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="font-bold text-lg">
          Nihongo<span className="text-primary">Level</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="hidden sm:inline text-sm font-semibold text-muted-foreground hover:text-foreground transition">
            Pricing
          </Link>
          <LangToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-8 pb-16 text-center">
        <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-2xl bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          ✿ {t("misc.poweredBy")}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Nihongo<span className="text-primary">Level</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {lang === "id" ? "Belajar berbicara seperti orang Jepang" : "Learn to speak like a native Japanese"}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={handleGoogle}
            disabled={signingIn}
            className="inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-3 text-base font-semibold shadow-sm hover:bg-muted disabled:opacity-60 transition"
          >
            {signingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
            )}
            {lang === "id" ? "Masuk" : "Sign in"}
          </button>
          <p className="text-xs text-muted-foreground">
            {lang === "id"
              ? "Gratis untuk memulai. Tidak perlu kartu kredit."
              : "Free to start. No credit card needed."}
          </p>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>

        <div className="mt-14 grid sm:grid-cols-3 gap-4 text-left">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
              <f.icon className="w-6 h-6 text-primary mb-3" />
              <div className="font-semibold">{f.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
            </div>
          ))}
        </div>

        <section className="mt-16 text-left">
          <h2 className="text-2xl font-bold text-center">
            {lang === "id" ? "Harga sederhana" : "Simple pricing"}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {lang === "id"
              ? "Mulai gratis. Upgrade kapan saja, batalkan kapan saja."
              : "Start free. Upgrade anytime, cancel anytime."}
          </p>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                {lang === "id" ? "Gratis" : "Free"}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-sm text-muted-foreground">
                  {lang === "id" ? "selamanya" : "forever"}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {lang === "id" ? "3 pencarian per hari" : "3 searches per day"}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {lang === "id" ? "Bahasa ID & EN" : "Indonesian & English"}
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-primary bg-card p-5 relative">
              <span className="absolute -top-2 right-3 inline-flex items-center rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold uppercase">
                {lang === "id" ? "Terpopuler" : "Most popular"}
              </span>
              <div className="text-xs font-semibold uppercase text-primary">Pro</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">$19</span>
                <span className="text-sm text-muted-foreground">
                  {lang === "id" ? "sekali bayar" : "one-time"}
                </span>
              </div>
              <p className="text-xs font-semibold text-primary mt-0.5">
                {lang === "id" ? "Akses seumur hidup" : "Lifetime access"}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {lang === "id" ? "Pencarian tanpa batas" : "Unlimited searches"}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {lang === "id" ? "Riwayat & favorit selamanya" : "History & favorites forever"}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {lang === "id" ? "My Level & Latihan Harian" : "My Level & Daily Practice"}
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-5 text-center">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted transition"
            >
              {lang === "id" ? "Lihat detail harga" : "See full pricing"}
            </Link>
          </div>
        </section>

        <p className="mt-12 text-xs text-muted-foreground">{t("home.footer")}</p>
      </main>

      <SiteFooter />
    </div>
  );
}
