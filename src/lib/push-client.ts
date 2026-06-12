import { supabase } from "@/integrations/supabase/client";
import {
  savePushSubscription,
  deletePushSubscription,
  sendTestPush,
} from "@/lib/push.functions";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) output[i] = rawData.charCodeAt(i);
  return output;
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

export async function getPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  return Notification.permission;
}

export async function getActiveSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isPushSupported()) return { ok: false, reason: "Browser tidak mendukung push notification." };
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: "VAPID key belum dikonfigurasi." };

  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return { ok: false, reason: "Silakan login dulu." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "Izin notifikasi ditolak." };

  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) reg = await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    }));

  const json = sub.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) {
    return { ok: false, reason: "Subscription tidak lengkap." };
  }

  try {
    await savePushSubscription({
      data: {
        endpoint: json.endpoint,
        p256dh,
        auth,
        userAgent: navigator.userAgent.slice(0, 200),
      },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Gagal menyimpan." };
  }
}

export async function unsubscribeFromPush(): Promise<{ ok: boolean }> {
  const sub = await getActiveSubscription();
  if (!sub) return { ok: true };
  const endpoint = sub.endpoint;
  try {
    await sub.unsubscribe();
  } catch {
    // ignore
  }
  try {
    await deletePushSubscription({ data: { endpoint } });
  } catch {
    // ignore
  }
  return { ok: true };
}

export async function triggerTestPush(): Promise<number> {
  const res = await sendTestPush();
  return res.sent;
}
