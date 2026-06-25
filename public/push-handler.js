// Imported by the generated /sw.js via workbox.importScripts.
// Handles incoming web push events and notification clicks.

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Nihongolive", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "Nihongolive";
  const options = {
    body: payload.body || "Saatnya belajar bahasa Jepang hari ini!",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    tag: payload.tag || "nihongolevel-reminder",
    data: { url: payload.url || "/translate" },
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const origin = self.location.origin;
      for (const client of allClients) {
        if (client.url.startsWith(origin)) {
          await client.focus();
          if ("navigate" in client) {
            try { await client.navigate(targetUrl); } catch {}
          }
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
