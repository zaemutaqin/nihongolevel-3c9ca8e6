import { Lock } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SignInButton } from "./SignInButton";

export function LockedFeature() {
  const lang = useLang();
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <div className="mx-auto mb-5 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
        <Lock className="w-7 h-7 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold">
        {lang === "id" ? "Login untuk mengakses fitur ini" : "Sign in to access this feature"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {lang === "id"
          ? "Riwayat dan favoritmu akan tersimpan di semua perangkat."
          : "Your history and favorites will be saved across all devices."}
      </p>
      <div className="mt-6 flex justify-center">
        <SignInButton />
      </div>
    </div>
  );
}
