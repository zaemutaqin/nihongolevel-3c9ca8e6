import { Crown, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { SignInButton } from "./SignInButton";
import { UpgradeModal } from "./UpgradeModal";

export function LockedFeature() {
  const lang = useLang();
  const { user, profile } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (profile?.is_pro) return null;

  return (
    <>
      <div className="relative mx-auto max-w-md px-6 py-20 text-center">
        <Link
          to="/"
          aria-label={lang === "id" ? "Tutup" : "Close"}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </Link>
        <div className="mx-auto mb-5 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 text-3xl">
          👑
        </div>
        <h2 className="text-xl font-bold">
          {lang === "id"
            ? "Fitur ini khusus untuk pengguna Pro"
            : "This feature is for Pro users only"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "id"
            ? "Upgrade ke Pro untuk akses riwayat, favorit, dan latihan."
            : "Upgrade to Pro for history, favorites and practice."}
        </p>
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowUpgrade(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <Crown className="w-4 h-4" />
            {lang === "id" ? "Upgrade ke Pro — $19" : "Upgrade to Pro — $19"}
          </button>
        </div>
        {!user && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>{lang === "id" ? "Sudah Pro?" : "Already Pro?"}</span>
            <SignInButton size="sm" />
          </div>
        )}
      </div>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
