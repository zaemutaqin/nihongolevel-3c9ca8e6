import { useState } from "react";
import { Crown } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { SignInButton } from "./SignInButton";
import { UpgradeModal } from "./UpgradeModal";

export function GuestPrompt() {
  const lang = useLang();
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-6 relative">
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="text-lg font-bold">
            {lang === "id"
              ? "Kamu sudah menggunakan 3 pencarian hari ini"
              : "You've used your 3 searches today"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {user
              ? lang === "id"
                ? "Upgrade ke Pro untuk pencarian unlimited dan buka semua fitur."
                : "Upgrade to Pro for unlimited searches and unlock everything."
              : lang === "id"
                ? "Login dulu, lalu upgrade ke Pro untuk akses tanpa batas."
                : "Sign in first, then upgrade to Pro for unlimited access."}
          </p>
          <ul className="mt-4 space-y-1.5 text-sm">
            {(lang === "id"
              ? [
                  "Pencarian unlimited",
                  "Riwayat selamanya",
                  "Favorit unlimited",
                  "My Level & Latihan Harian",
                ]
              : [
                  "Unlimited searches",
                  "History forever",
                  "Unlimited favorites",
                  "My Level & Daily Practice",
                ]
            ).map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <button
              onClick={() => setShowUpgrade(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              <Crown className="w-4 h-4" />
              {lang === "id" ? "Mulai Pro Sekarang — $19" : "Start Pro Now — $19"}
            </button>
            {!user && (
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>{lang === "id" ? "Sudah Pro?" : "Already Pro?"}</span>
                <SignInButton size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
