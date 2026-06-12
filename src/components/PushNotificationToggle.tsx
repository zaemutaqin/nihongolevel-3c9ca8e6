import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import {
  isPushSupported,
  getActiveSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  triggerTestPush,
} from "@/lib/push-client";

export function PushNotificationToggle() {
  const lang = useLang();
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = isPushSupported();
      if (!mounted) return;
      setSupported(ok);
      if (!ok) return;
      const sub = await getActiveSubscription();
      if (mounted) setEnabled(!!sub && Notification.permission === "granted");
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!supported) {
    return (
      <div className="text-xs text-muted-foreground px-2 py-1.5">
        {lang === "id"
          ? "Push notification belum tersedia di browser ini."
          : "Push notifications unavailable in this browser."}
      </div>
    );
  }

  const toggle = async () => {
    setLoading(true);
    setMsg(null);
    try {
      if (enabled) {
        await unsubscribeFromPush();
        setEnabled(false);
        setMsg(lang === "id" ? "Notifikasi dimatikan." : "Notifications off.");
      } else {
        const res = await subscribeToPush();
        if (res.ok) {
          setEnabled(true);
          setMsg(lang === "id" ? "Notifikasi aktif!" : "Notifications on!");
        } else {
          setMsg(res.reason);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const test = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const sent = await triggerTestPush();
      setMsg(
        sent > 0
          ? lang === "id"
            ? "Notifikasi test terkirim ✓"
            : "Test sent ✓"
          : lang === "id"
            ? "Tidak ada perangkat aktif."
            : "No active devices.",
      );
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={toggle}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border text-sm font-semibold hover:bg-muted transition disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : enabled ? (
          <BellOff className="w-4 h-4" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        {enabled
          ? lang === "id"
            ? "Matikan pengingat harian"
            : "Turn off daily reminder"
          : lang === "id"
            ? "Aktifkan pengingat harian"
            : "Enable daily reminder"}
      </button>
      {enabled && (
        <button
          onClick={test}
          disabled={loading}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition py-1"
        >
          {lang === "id" ? "Kirim notifikasi test" : "Send test notification"}
        </button>
      )}
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
