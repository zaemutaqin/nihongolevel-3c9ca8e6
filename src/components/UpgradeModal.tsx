import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, Crown, ShieldCheck, Gift } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { gtagEvent } from "@/lib/gtag";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const lang = useLang();
  const { user } = useAuth();
  const { openCheckout, loading } = usePaddleCheckout();
  const [signingIn, setSigningIn] = useState(false);

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
          "Levelku",
          "Latihan Harian",
          "Bahasa ID + EN",
          "Semua fitur baru di masa depan",
        ]
      : [
          "Unlimited searches",
          "History kept forever",
          "Unlimited favorites",
          "My Level & Dashboard",
          "Daily Practice",
          "Indonesian + English",
          "All future features included",
        ];

  const triggerSignIn = async () => {
    setSigningIn(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (r.error) setSigningIn(false);
    } catch {
      setSigningIn(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      await triggerSignIn();
      return;
    }
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
              <button
                onClick={handleUpgrade}
                disabled={loading || signingIn}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
              >
                {loading || signingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4" />
                )}
                {lang === "id" ? "Beli Sekarang — $19" : "Buy Now — $19"}
              </button>

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

            <GiftCodeCard onNeedSignIn={triggerSignIn} hasUser={!!user} />

            {!user && (
              <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
                {lang === "id" ? "Sudah Pro? " : "Already Pro? "}
                <button
                  type="button"
                  onClick={triggerSignIn}
                  className="font-semibold text-primary hover:underline"
                >
                  {lang === "id" ? "Masuk sekarang" : "Sign in now"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function GiftCodeCard({
  onNeedSignIn,
  hasUser,
}: {
  onNeedSignIn: () => void | Promise<void>;
  hasUser: boolean;
}) {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const submit = async () => {
    if (!code.trim() || busy) return;
    if (!hasUser) {
      await onNeedSignIn();
      return;
    }
    setBusy(true);
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
      if (res.status === 429) {
        setMsg({
          kind: "err",
          text:
            lang === "id"
              ? "Terlalu banyak percobaan. Coba lagi besok."
              : "Too many attempts. Please try again tomorrow.",
        });
        return;
      }
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok === true) {
        setMsg({
          kind: "ok",
          text:
            lang === "id"
              ? "✓ Kode berhasil diaktifkan! Selamat menjadi Pro 🎉"
              : "✓ Code activated! Welcome to Pro 🎉",
        });
        setCode("");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMsg({
          kind: "err",
          text:
            lang === "id"
              ? "Kode tidak valid atau sudah digunakan"
              : "Invalid or already-used code",
        });
      }
    } catch {
      setMsg({
        kind: "err",
        text:
          lang === "id"
            ? "Tidak bisa menghubungi server. Coba lagi."
            : "Could not reach server. Please retry.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 py-3 text-sm font-medium hover:bg-muted/60 transition"
      >
        <Gift className="w-4 h-4" />
        {lang === "id" ? "Punya kode hadiah?" : "Have a gift code?"}
      </button>
    );
  }

  return (
    <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4 relative">
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setMsg(null);
          setCode("");
        }}
        aria-label="Close"
        className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Gift className="w-4 h-4 text-primary" />
        {lang === "id" ? "Punya kode hadiah?" : "Have a gift code?"}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {lang === "id"
          ? "Masukkan kode akses Pro di sini"
          : "Enter your Pro access code below"}
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={lang === "id" ? "Masukkan kode…" : "Enter code…"}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !code.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : lang === "id" ? (
            "Aktifkan"
          ) : (
            "Activate"
          )}
        </button>
      </div>
      {msg && (
        <p
          className={
            "mt-2 text-xs " +
            (msg.kind === "ok" ? "text-green-600 dark:text-green-400" : "text-destructive")
          }
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
