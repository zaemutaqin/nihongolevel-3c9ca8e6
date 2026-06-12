import { useState } from "react";
import { Loader2, Check, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { lovable } from "@/integrations/lovable";
import { useT, setLang, useLang, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SiteFooter } from "./SiteFooter";

function LangToggle() {
  const lang = useLang();
  return (
    <div className="inline-flex items-center gap-0 border border-foreground/80 text-[11px] font-semibold uppercase tracking-[0.18em]">
      {(["id", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "px-2.5 py-1 transition",
            lang === l ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/10",
          )}
        >
          {l === "id" ? "ID" : "EN"}
        </button>
      ))}
    </div>
  );
}

export function Landing() {
  const { lang } = useT();
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
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to sign in");
      setSigningIn(false);
    }
  };

  const id = lang === "id";

  const features = id
    ? [
        { num: "01", title: "Ekspresi natural", desc: "Yang benar-benar diucapkan orang Jepang — bukan terjemahan kaku dari buku teks." },
        { num: "02", title: "Riwayat pribadi", desc: "Setiap pencarian tersimpan, tersinkron rapi di seluruh perangkat Anda." },
        { num: "03", title: "Latihan situasi", desc: "Ulang ekspresi favorit dengan latihan harian yang dipersonalisasi." },
      ]
    : [
        { num: "01", title: "Natural expressions", desc: "What Japanese people actually say — not stiff textbook translations." },
        { num: "02", title: "Personal history", desc: "Every search saved and synced cleanly across every device." },
        { num: "03", title: "Situation practice", desc: "Replay your favorite expressions with personalized daily practice." },
      ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ====== TOP NAV ====== */}
      <header className="border-b border-foreground/15">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 py-4 flex items-center justify-between">
          <nav className="hidden sm:flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
            <a href="#about" className="hover:text-foreground transition">{id ? "Tentang" : "About"}</a>
            <a href="#features" className="hover:text-foreground transition">{id ? "Program" : "Features"}</a>
            <Link to="/pricing" className="hover:text-foreground transition">{id ? "Harga" : "Pricing"}</Link>
          </nav>
          <div className="sm:hidden text-[11px] font-semibold uppercase tracking-[0.22em]">Menu</div>
          <LangToggle />
        </div>
      </header>

      {/* ====== HERO — magazine split ====== */}
      <section className="relative border-b border-foreground/15">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-12 gap-0">
          {/* Left — logo block */}
          <div className="lg:col-span-7 px-6 sm:px-10 py-12 lg:py-20 relative">
            <h1 className="font-display text-[clamp(3.5rem,11vw,9rem)] leading-[0.88] tracking-tight">
              <span className="block">Nihongo</span>
              <span className="block italic relative">
                Level
                <span className="absolute left-0 -bottom-3 h-2 w-40 bg-primary" aria-hidden />
              </span>
            </h1>

            <p className="mt-10 max-w-md text-base text-foreground/70 leading-relaxed">
              {id
                ? "Sebuah alat yang menjembatani buku teks dengan percakapan jalanan — Jepang seperti yang benar-benar diucapkan."
                : "A tool that bridges the textbook and the street — Japanese as it is actually spoken."}
            </p>
          </div>

          {/* Right — solid red block with date + vertical text */}
          <aside className="lg:col-span-5 bg-primary text-primary-foreground px-6 sm:px-10 py-12 lg:py-20 relative grid grid-cols-[1fr_auto] gap-6">
            <div className="min-w-0">
              <div className="font-display text-5xl sm:text-6xl leading-none">
                N5<span className="text-primary-foreground/60">·</span>N1
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.28em] font-semibold text-primary-foreground/80">
                {id ? "Edisi Harian" : "Daily Edition"}
              </div>

              <div className="mt-12 flex items-baseline gap-2">
                <span className="font-display italic text-3xl">日本語</span>
                <span className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">vol. 01</span>
              </div>
              <p className="mt-6 max-w-xs text-sm text-primary-foreground/85 leading-relaxed">
                {id
                  ? "Belajar berbicara seperti orang Jepang, bukan sekadar lulus JLPT."
                  : "Learn to speak like a native — not just to pass the JLPT."}
              </p>
            </div>

            <div className="writing-vertical text-[11px] uppercase tracking-[0.4em] font-semibold text-primary-foreground/80 self-start">
              {id ? "Edisi Khusus · Tokyo / Jakarta" : "Special Issue · Tokyo / Jakarta"}
            </div>
          </aside>
        </div>
      </section>

      {/* ====== CTA BAR ====== */}
      <section className="border-b border-foreground/15">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 py-10 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="text-[11px] uppercase tracking-[0.3em] text-foreground/60 font-semibold">
              {id ? "Mulai hari ini" : "Begin today"}
            </div>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl leading-[1.02]">
              {id ? "Masuk. Cari. Bicara." : "Sign in. Search. Speak."}
            </h2>
          </div>
          <div className="lg:col-span-5 flex flex-col items-start gap-3">
            <button
              onClick={handleGoogle}
              disabled={signingIn}
              className="group inline-flex items-center justify-between w-full gap-4 bg-primary text-primary-foreground px-6 py-5 text-base font-semibold uppercase tracking-[0.18em] hover:bg-foreground transition disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-3">
                {signingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M21.6 12.23c0-.78-.07-1.53-.2-2.25H12v4.26h5.4a4.6 4.6 0 0 1-2 3.03v2.5h3.24c1.9-1.76 3-4.34 3-7.54z"/>
                    <path fill="currentColor" opacity=".7" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.6-4.12H3.06v2.6A10 10 0 0 0 12 22z"/>
                  </svg>
                )}
                {id ? "Masuk dengan Google" : "Sign in with Google"}
              </span>
              <ArrowRight className="w-5 h-5 transition group-hover:translate-x-1" />
            </button>
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/55 font-semibold">
              {id ? "Gratis — tanpa kartu kredit" : "Free — no credit card"}
            </p>
            {err && <p className="text-sm text-primary">{err}</p>}
          </div>
        </div>
      </section>

      {/* ====== FEATURES — magazine grid ====== */}
      <section id="features" className="border-b border-foreground/15">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 py-16 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-10 mb-14">
            <div className="lg:col-span-4">
              <div className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">
                {id ? "Tiga Pilar" : "Three Pillars"}
              </div>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl leading-[1.02]">
                {id ? "Cara yang berbeda untuk belajar." : "A different way to study."}
              </h2>
            </div>
            <p className="lg:col-span-7 lg:col-start-6 text-foreground/70 leading-relaxed text-lg self-end">
              {id
                ? "Ditulis untuk pelajar yang lelah menghafal — disusun seperti majalah kuratorial: lugas, berkarakter, dan terasa hidup."
                : "Written for learners tired of memorising — laid out like a curated magazine: direct, opinionated, and alive."}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 border-t border-foreground/15">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={cn(
                  "py-10 sm:px-8 first:pl-0 last:pr-0",
                  i > 0 && "sm:border-l border-foreground/15",
                )}
              >
                <div className="font-display text-5xl text-primary">{f.num}</div>
                <h3 className="mt-6 font-display text-2xl">{f.title}</h3>
                <p className="mt-3 text-sm text-foreground/70 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== PRICING — color blocked ====== */}
      <section id="pricing" className="border-b border-foreground/15">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2">
          {/* Free */}
          <div className="px-6 sm:px-10 py-14 lg:py-20 border-r border-foreground/15">
            <div className="text-[11px] uppercase tracking-[0.3em] font-bold text-foreground/60">
              {id ? "Edisi Gratis" : "Free Edition"}
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-6xl">$0</span>
              <span className="text-sm uppercase tracking-[0.2em] text-foreground/60">
                {id ? "selamanya" : "forever"}
              </span>
            </div>
            <ul className="mt-8 space-y-3 text-base">
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />{id ? "3 pencarian per hari" : "3 searches per day"}</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />{id ? "Bahasa ID & EN" : "Indonesian & English"}</li>
            </ul>
          </div>

          {/* Pro Lifetime — pink block */}
          <div className="bg-secondary text-secondary-foreground px-6 sm:px-10 py-14 lg:py-20 relative">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-2 text-[10px] uppercase tracking-[0.3em] font-bold">
              {id ? "Sekali Bayar" : "One-time"}
            </div>
            <div className="text-[11px] uppercase tracking-[0.3em] font-bold">{id ? "Pro · Seumur Hidup" : "Pro · Lifetime"}</div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-6xl">$20</span>
              <span className="text-sm uppercase tracking-[0.2em] opacity-70">
                {id ? "sekali bayar" : "one-time"}
              </span>
            </div>
            <p className="mt-2 text-xs opacity-70">{id ? "Bayar sekali, milik selamanya" : "Pay once, yours forever"}</p>
            <ul className="mt-8 space-y-3 text-base">
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />{id ? "Pencarian tanpa batas" : "Unlimited searches"}</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />{id ? "Riwayat & favorit selamanya" : "History & favorites forever"}</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />{id ? "Semua fitur masa depan" : "All future features"}</li>
            </ul>
            <Link
              to="/pricing"
              className="mt-8 inline-flex items-center gap-3 bg-foreground text-background px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] hover:bg-primary transition"
            >
              {id ? "Lihat detail" : "See details"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ====== CLOSING editorial block ====== */}
      <section id="about" className="bg-secondary">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 py-20 lg:py-28 grid lg:grid-cols-12 gap-10 items-end">
          <h2 className="lg:col-span-8 font-display text-4xl sm:text-6xl leading-[1.02]">
            {id
              ? <>Berhenti menerjemahkan. <em className="text-primary not-italic">Mulailah berbicara.</em></>
              : <>Stop translating. <em className="text-primary not-italic">Start speaking.</em></>}
          </h2>
          <div className="lg:col-span-4 lg:text-right">
            <button
              onClick={handleGoogle}
              disabled={signingIn}
              className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] hover:bg-foreground transition disabled:opacity-60"
            >
              {id ? "Mulai sekarang" : "Start now"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
