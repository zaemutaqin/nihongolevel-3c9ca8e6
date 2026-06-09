import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, Crown } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { SignInButton } from "./SignInButton";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

type Plan = "monthly" | "yearly";

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const lang = useLang();
  const { user } = useAuth();
  const { openCheckout, loading } = usePaddleCheckout();
  const [plan, setPlan] = useState<Plan>("yearly");

  // Lock body scroll + ESC to close while open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const title =
    lang === "id"
      ? "Upgrade ke Pro — akses semua fitur tanpa batas"
      : "Upgrade to Pro — unlock everything";

  const rows: { label: string; free: string; pro: string }[] =
    lang === "id"
      ? [
          { label: "Pencarian", free: "3/hari", pro: "Unlimited" },
          { label: "Riwayat", free: "✗", pro: "✓ Selamanya" },
          { label: "Favorit", free: "✗", pro: "✓ Unlimited" },
          { label: "My Learning", free: "✗", pro: "✓" },
          { label: "Latihan Harian", free: "✗", pro: "✓" },
          { label: "Bahasa ID + EN", free: "✓", pro: "✓" },
        ]
      : [
          { label: "Searches", free: "3/day", pro: "Unlimited" },
          { label: "History", free: "✗", pro: "✓ Forever" },
          { label: "Favorites", free: "✗", pro: "✓ Unlimited" },
          { label: "My Learning", free: "✗", pro: "✓" },
          { label: "Daily Practice", free: "✗", pro: "✓" },
          { label: "Bahasa ID + EN", free: "✓", pro: "✓" },
        ];

  const handleUpgrade = async () => {
    if (!user) return;
    await openCheckout({
      priceId: plan === "monthly" ? "pro_monthly" : "pro_yearly",
      customerEmail: user.email ?? undefined,
      userId: user.id,
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="relative w-[95%] sm:w-full max-w-[480px] my-8 rounded-2xl bg-card border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-lg hover:bg-muted transition z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 px-2.5 py-1 text-xs font-semibold mb-3">
            <Crown className="w-3.5 h-3.5" /> Pro
          </div>
          <h2 className="text-xl font-bold leading-snug">{title}</h2>

          <div className="mt-5 rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">
                    {lang === "id" ? "Fitur" : "Feature"}
                  </th>
                  <th className="text-center px-3 py-2 font-semibold text-muted-foreground">
                    {lang === "id" ? "Gratis" : "Free"}
                  </th>
                  <th className="text-center px-3 py-2 font-semibold text-primary">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{r.label}</td>
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {r.free}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold text-foreground">
                      {r.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <PlanCard
              active={plan === "monthly"}
              onClick={() => setPlan("monthly")}
              title={lang === "id" ? "Bulanan" : "Monthly"}
              price="$5"
              suffix={lang === "id" ? "/bulan" : "/month"}
            />
            <PlanCard
              active={plan === "yearly"}
              onClick={() => setPlan("yearly")}
              title={lang === "id" ? "Tahunan" : "Yearly"}
              price="$45"
              suffix={lang === "id" ? "/tahun" : "/year"}
              badge={lang === "id" ? "Terpopuler" : "Most Popular"}
              hint={lang === "id" ? "Hemat 25%" : "Save 25%"}
            />
          </div>

          <div className="mt-8">
            {user ? (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4" />
                )}
                {lang === "id" ? "Mulai Pro Sekarang" : "Start Pro Now"}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-center text-muted-foreground">
                  {lang === "id"
                    ? "Login dulu untuk upgrade ke Pro"
                    : "Sign in first to upgrade to Pro"}
                </p>
                <SignInButton />
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PlanCard({
  active,
  onClick,
  title,
  price,
  suffix,
  badge,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  price: string;
  suffix: string;
  badge?: string;
  hint?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative text-left rounded-xl border-2 p-3 transition",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/40",
      )}
    >
      {badge && (
        <span className="absolute -top-2 right-2 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold uppercase">
          {badge}
        </span>
      )}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          {title}
        </span>
        {active && <Check className="w-4 h-4 text-primary" />}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{price}</span>
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
      {hint && (
        <p className="mt-1 text-[11px] font-semibold text-primary">{hint}</p>
      )}
    </button>
  );
}
