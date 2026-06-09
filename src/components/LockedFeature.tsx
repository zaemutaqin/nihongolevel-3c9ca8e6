import { Lock, Crown } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { SignInButton } from "./SignInButton";
import { UpgradeModal } from "./UpgradeModal";

export function LockedFeature() {
  const lang = useLang();
  const { user, profile } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <div className="mx-auto mb-5 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
          <Lock className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">
          {lang === "id"
            ? "Login untuk mengakses fitur ini"
            : "Sign in to access this feature"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "id"
            ? "Login dulu, lalu upgrade ke Pro untuk membuka semua fitur."
            : "Sign in first, then upgrade to Pro to unlock all features."}
        </p>
        <div className="mt-6 flex justify-center">
          <SignInButton />
        </div>
      </div>
    );
  }

  if (profile?.is_pro) return null;

  return (
    <>
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <div className="mx-auto mb-5 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400/15 text-yellow-700 dark:text-yellow-300">
          <Crown className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold">
          {lang === "id"
            ? "Fitur ini hanya untuk Pro"
            : "This feature is for Pro members"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "id"
            ? "Upgrade ke Pro untuk membuka riwayat, favorit, dashboard, dan latihan harian."
            : "Upgrade to Pro to unlock history, favorites, dashboard, and daily practice."}
        </p>
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowUpgrade(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <Crown className="w-4 h-4" />
            {lang === "id" ? "Upgrade ke Pro" : "Upgrade to Pro"}
          </button>
        </div>
      </div>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
