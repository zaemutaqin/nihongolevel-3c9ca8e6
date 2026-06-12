import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — NihongoLevel Pro" },
      {
        name: "description",
        content:
          "Free plan with 3 daily searches, or Pro lifetime access for $19 — unlimited searches, history, and favorites.",
      },
      { property: "og:title", content: "Pricing — NihongoLevel Pro" },
      {
        property: "og:description",
        content:
          "Free with 3 searches per day. Upgrade to Pro for $19 one-time — lifetime access to every feature, no subscription.",
      },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),


  component: PricingPage,
});

function PricingPage() {
  const lang = useLang();

  const features = lang === "id"
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link to="/" className="font-bold text-lg">
          Nihongo<span className="text-primary">Level</span>
        </Link>
        <Link
          to="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {lang === "id" ? "Kembali" : "Back"}
        </Link>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 px-3 py-1 text-xs font-semibold mb-3">
            <Crown className="w-3.5 h-3.5" /> NihongoLevel Pro
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {lang === "id"
              ? "Harga sederhana, semua fitur tanpa batas"
              : "Simple pricing, everything unlocked"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {lang === "id"
              ? "Mulai gratis. Upgrade sekali, akses seumur hidup."
              : "Start free. Pay once, lifetime access."}
          </p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 gap-4">
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
                ? "Untuk pengguna kasual yang ingin mencoba."
                : "For casual learners trying it out."}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <Li>{lang === "id" ? "3 pencarian per hari" : "3 searches per day"}</Li>
              <Li>{lang === "id" ? "Bahasa Indonesia & English" : "Indonesian & English UI"}</Li>
            </ul>
          </div>

          <div className="rounded-2xl border-2 border-primary bg-card p-6 relative">
            <span className="absolute -top-2 right-4 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold uppercase">
              {lang === "id" ? "Akses Seumur Hidup" : "Lifetime Access"}
            </span>
            <div className="text-xs font-semibold uppercase text-primary">Pro</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold">$19</span>
              <span className="text-sm text-muted-foreground">
                {lang === "id" ? "sekali bayar" : "one-time"}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-primary">
              {lang === "id"
                ? "Bayar sekali, akses selamanya"
                : "Pay once, access forever"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === "id"
                ? "Untuk yang serius belajar setiap hari."
                : "For learners who practice every day."}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <Li>{lang === "id" ? "Pencarian tanpa batas" : "Unlimited searches"}</Li>
              <Li>{lang === "id" ? "Riwayat selamanya" : "Full history, kept forever"}</Li>
              <Li>{lang === "id" ? "Favorit tanpa batas" : "Unlimited favorites"}</Li>
              <Li>{lang === "id" ? "My Level & Latihan Harian" : "My Level & Daily Practice"}</Li>
              <Li>{lang === "id" ? "Semua fitur baru di masa depan" : "All future features included"}</Li>
            </ul>
            <Link
              to="/"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition"
            >
              <Crown className="w-4 h-4" />
              {lang === "id" ? "Beli Sekarang — $19" : "Buy Now — $19"}
            </Link>
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
