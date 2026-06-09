import { X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SignInButton } from "./SignInButton";

export function GuestPrompt({ onDismiss }: { onDismiss: () => void }) {
  const lang = useLang();
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onDismiss}>
      <div
        className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="text-3xl mb-3">✨</div>
        <h3 className="text-lg font-bold">
          {lang === "id" ? "Suka NihongoLevel? Simpan kemajuanmu!" : "Loving NihongoLevel? Save your progress!"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "id"
            ? "Login untuk menyimpan riwayat, favorit, dan akses latihan situasi."
            : "Sign in to save history, favorites, and access situation practice."}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <SignInButton />
          <button
            onClick={onDismiss}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition"
          >
            {lang === "id" ? "Lanjut tanpa login" : "Continue without sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
