import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Crown, Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — NihongoLevel Pro" },
      {
        name: "description",
        content:
          "Free with 3 daily searches. Pro $20 one-time — unlimited searches, history, favorites, daily practice, forever.",
      },
      { property: "og:title", content: "Pricing — NihongoLevel Pro" },
      {
        property: "og:description",
        content:
          "Free with 3 searches per day. Pro: $20 one-time lifetime access. 30-day money back guarantee.",
      },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: PricingPage,
});

function PricingPage() {
  const lang = useLang();
  const { user } = useAuth();
  const { openCheckout, loading } = usePaddleCheckout();
  const [busy, setBusy] = useState(false);

  const features =
    lang === "id"
      ? [
          { label: "Pencarian per hari", free: "3", pro: "Unlimited" },
          { label: "Riwayat pencarian", free: "—", pro: "Selamanya" },
          { label: "Favorit", free: "—", pro: "Unlimited" },
          { label: "My Level / Dashboard", free: "—", pro: "✓" },
          { label: "Latihan Harian", free: "—", pro: "✓" },
          { label: "Bahasa Indonesia + English", free: "✓", pro: "✓" },
        ]
      : [
          { label: "Searches per day", free: "3", pro: "Unlimited" },
          { label: "Search history", free: "—", pro: "Forever" },
          { label: "Favorites", free: "—", pro: "Unlimited" },
          { label: "My Level / Dashboard", free: "—", pro: "✓" },
          { label: "Daily Practice", free: "—", pro: "✓" },
          { label: "Indonesian + English", free: "✓", pro: "✓" },
        ];

  const handleBuy = async () => {
    setBusy(true);
    try {
      if (!user) {
        await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin + "/pricing",
        });
        return;
      }
      await openCheckout({
        priceId: "pro_lifetime",
        customerEmail: user.email ?? undefined,
        userId: user.id,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link to="/" className="font-bold text-lg">
          Nihongo<span className="text-primary">Level</span>
        </Link>
        <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          {lang === "id" ? "Kembali" : "Back"}
        </Link>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 px-3 py-1 text-xs font-semibold mb-3">
            <Crown className="w-3.5 h-3.5" /> NihongoLevel Pro
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {lang === "id"
              ? "Sederhana. Bayar sekali, milik selamanya."
              : "Simple. Pay once, yours forever."}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {lang === "id"
              ? "Mulai gratis. Upgrade ke Pro dengan satu kali pembayaran."
              : "Start free. Upgrade to Pro with a single one-time payment."}
          </p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          {/* Free */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              {lang === "id" ? "Gratis" : "Free"}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-sm text-muted-foreground">
                {lang === "id" ? "selamanya" : "forever"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === "id"
                ? "Untuk yang ingin mencoba."
                : "For casual learners trying it out."}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <Li>{lang === "id" ? "3 pencarian per hari" : "3 searches per day"}</Li>
              <Li>{lang === "id" ? "Bahasa ID & EN" : "Indonesian & English UI"}</Li>
            </ul>
          </div>

          {/* Lifetime */}
          <div className="rounded-2xl border-2 border-primary bg-card p-6 relative">
            <span className="absolute -top-2 right-4 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold uppercase">
              {lang === "id" ? "Sekali Bayar" : "One-time"}
            </span>
            <div className="text-xs font-semibold uppercase text-primary">
              {lang === "id" ? "Pro Seumur Hidup" : "Pro Lifetime"}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold">$20</span>
              <span className="text-sm text-muted-foreground">
                {lang === "id" ? "sekali bayar" : "one-time"}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-primary">
              {lang === "id"
                ? "Bayar sekali · selamanya milik Anda"
                : "Pay once · yours forever"}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <Li>{lang === "id" ? "Pencarian tanpa batas" : "Unlimited searches"}</Li>
              <Li>{lang === "id" ? "Riwayat & favorit selamanya" : "History & favorites forever"}</Li>
              <Li>{lang === "id" ? "Semua fitur baru di masa depan" : "All future features included"}</Li>
              <Li>{lang === "id" ? "Tanpa langganan" : "No subscription"}</Li>
            </ul>
            <button
              onClick={handleBuy}
              disabled={loading || busy}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
              {lang === "id" ? "Beli — $20 selamanya" : "Buy — $20 lifetime"}
            </button>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">
                  {lang === "id" ? "Fitur" : "Feature"}
                </th>
                <th className="text-center px-4 py-2 font-semibold text-muted-foreground">
                  {lang === "id" ? "Gratis" : "Free"}
                </th>
                <th className="text-center px-4 py-2 font-semibold text-primary">Pro</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.label} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{f.label}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">{f.free}</td>
                  <td className="px-4 py-2 text-center font-semibold">{f.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {lang === "id"
            ? "Pembayaran diproses oleh Paddle.com sebagai Merchant of Record kami. Termasuk pajak yang berlaku. Jaminan uang kembali 30 hari — lihat "
            : "Payments are processed by Paddle.com as our Merchant of Record. Applicable taxes included. 30-day money back guarantee — see our "}
          <Link to="/refund" className="underline hover:text-foreground">
            {lang === "id" ? "kebijakan pengembalian dana" : "refund policy"}
          </Link>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
