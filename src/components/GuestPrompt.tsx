import { useLang } from "@/lib/i18n";
import { SignInButton } from "./SignInButton";

export function GuestPrompt() {
  const lang = useLang();
  const features =
    lang === "id"
      ? [
          "Riwayat tersimpan",
          "Favorit",
          "Latihan situasi",
          "Pencarian unlimited",
        ]
      : [
          "Saved history",
          "Favorites",
          "Situation practice",
          "Unlimited searches",
        ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-6 relative">
        <div className="text-3xl mb-3">🔒</div>
        <h3 className="text-lg font-bold">
          {lang === "id"
            ? "Kamu sudah menggunakan 3 pencarian gratis"
            : "You've used your 3 free searches"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "id"
            ? "Login untuk melanjutkan belajar bahasa Jepang secara gratis"
            : "Login to continue learning Japanese for free"}
        </p>
        <ul className="mt-4 space-y-1.5 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <SignInButton />
        </div>
      </div>
    </div>
  );
}
