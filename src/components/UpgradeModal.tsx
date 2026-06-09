import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, Crown, ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { SignInButton } from "./SignInButton";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const lang = useLang();
  const { user } = useAuth();
  const { openCheckout, loading } = usePaddleCheckout();

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

  const features =
    lang === "id"
      ? [
          "Pencarian unlimited",
          "Riwayat tersimpan selamanya",
          "Favorit unlimited",
          "My Learning & Dashboard",
          "Latihan Harian",
          "Bahasa ID + EN",
          "Semua fitur baru di masa depan",
        ]
      : [
          "Unlimited searches",
          "History kept forever",
          "Unlimited favorites",
          "My Learning & Dashboard",
          "Daily Practice",
          "Indonesian + English",
          "All future features included",
        ];

  const handleUpgrade = async () => {
    if (!user) return;
    await openCheckout({
      priceId: "pro_lifetime",
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
          className="relative w-[95%] sm:w-full max-w-[460px] my-8 rounded-2xl bg-card border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-lg hover:bg-muted transition z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 px-3 py-1 text-xs font-semibold mb-3">
              <Crown className="w-3.5 h-3.5" /> NihongoLevel Pro
            </div>
            <h2 className="text-xl font-bold leading-snug">
              {lang === "id" ? "Akses Seumur Hidup" : "Lifetime Access"}
            </h2>

            <div className="mt-5 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold">$19</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {lang === "id"
                ? "Bayar sekali, akses selamanya"
                : "Pay once, access forever"}
            </p>

            <ul className="mt-6 space-y-2 text-sm text-left">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
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
                  {lang === "id" ? "Beli Sekarang — $19" : "Buy Now — $19"}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-center text-muted-foreground">
                    {lang === "id"
                      ? "Login dulu untuk membeli Pro"
                      : "Sign in first to purchase Pro"}
                  </p>
                  <SignInButton />
                </div>
              )}

              <p className="mt-3 text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {lang === "id"
                  ? "Pembayaran aman via Paddle · Sekali bayar, selamanya aktif"
                  : "Secure payment via Paddle · Pay once, active forever"}
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1 text-[11px] font-semibold">
                <ShieldCheck className="w-3 h-3" />
                {lang === "id"
                  ? "Jaminan uang kembali 30 hari"
                  : "30-day money back guarantee"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
