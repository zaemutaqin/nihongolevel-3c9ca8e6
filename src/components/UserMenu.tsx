import { useState, useRef, useEffect } from "react";
import { LogOut, Crown, KeyRound, Loader2, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { SignInButton } from "./SignInButton";
import { UpgradeModal } from "./UpgradeModal";

export function UserMenu() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [showProInput, setShowProInput] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return <SignInButton size="sm" />;

  const name = profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "User";
  const email = profile?.email ?? user.email ?? "";
  const avatar = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;
  const isPro = profile?.is_pro ?? false;
  const initial = (name || email || "?")[0].toUpperCase();

  const activate = async () => {
    setActivating(true);
    setMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch("/api/activate-pro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok === true) {
        setMsg(lang === "id" ? "Pro aktif! 🎉" : "Pro activated! 🎉");
        setCode("");
        setShowProInput(false);
        await refreshProfile();
      } else if (res.status === 401) {
        setMsg(lang === "id" ? "Harus login dulu" : "Please sign in first");
      } else {
        setMsg(lang === "id" ? "Kode tidak valid" : "Invalid code");
      }
    } catch {
      setMsg(lang === "id" ? "Gagal terhubung" : "Connection failed");
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border border-border bg-muted text-sm font-semibold hover:ring-2 hover:ring-primary/40 transition"
        aria-label="User menu"
      >
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initial}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-popover shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              {avatar ? (
                <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{name}</div>
                <div className="text-xs text-muted-foreground truncate">{email}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {isPro ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 text-xs font-semibold">
                  <Crown className="w-3 h-3" /> Pro ✓
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-semibold">
                  {lang === "id" ? "Gratis" : "Free"}
                </span>
              )}
            </div>
            {isPro && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {lang === "id"
                  ? "Akses seumur hidup · tidak ada perpanjangan"
                  : "Lifetime access · no renewals"}
              </p>
            )}
          </div>

          {!isPro && (
            <div className="p-3 border-b border-border space-y-2">
              <button
                onClick={() => { setOpen(false); setShowUpgrade(true); }}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
              >
                <Crown className="w-4 h-4" />
                {lang === "id" ? "Upgrade ke Pro — $19 sekali bayar" : "Upgrade to Pro — $19 one-time"}
              </button>
              {!showProInput ? (
                <button
                  onClick={() => { setShowProInput(true); setMsg(null); }}
                  className="w-full inline-flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted transition"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {lang === "id" ? "Punya kode akses Pro?" : "Have a Pro access code?"}
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={lang === "id" ? "Masukkan kode" : "Enter code"}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  />
                  <button
                    onClick={activate}
                    disabled={activating || !code.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border text-sm font-semibold disabled:opacity-50"
                  >
                    {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {lang === "id" ? "Aktifkan Pro" : "Activate Pro"}
                  </button>
                </div>
              )}
              {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
            </div>
          )}

          <button
            onClick={() => { setOpen(false); signOut(); }}
            className="w-full inline-flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-muted transition"
          >
            <LogOut className="w-4 h-4" />
            {lang === "id" ? "Keluar" : "Sign out"}
          </button>
        </div>
      )}
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
