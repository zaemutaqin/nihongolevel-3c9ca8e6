import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

export function UpgradeSuccessListener() {
  const { profile, refreshProfile, user } = useAuth();
  const lang = useLang();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const search = useSearch({ strict: false }) as any;
  const navigate = useNavigate();
  const celebrated = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (search?.upgraded !== "1" && search?.upgraded !== 1) return;
    if (celebrated.current) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      await refreshProfile();
      if (attempts >= 20) clearInterval(interval);
    }, 1500);

    return () => clearInterval(interval);
  }, [search?.upgraded, user, refreshProfile]);

  useEffect(() => {
    if (!profile?.is_pro) return;
    if (search?.upgraded !== "1" && search?.upgraded !== 1) return;
    if (celebrated.current) return;
    celebrated.current = true;
    toast.success(
      lang === "id"
        ? "Selamat! Semua fitur sekarang aktif 🎉"
        : "Congrats! All features are now unlocked 🎉",
      { duration: 6000 },
    );
    // Clear the query param
    navigate({ to: ".", search: {} as never, replace: true });
  }, [profile?.is_pro, search?.upgraded, lang, navigate]);

  return null;
}
