// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    optimizeDeps: {
      ignoreOutdatedRequests: true,
    },
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null, // we register from src/lib/pwa-register.ts with strict guards
        filename: "sw.js",
        devOptions: { enabled: false },
        workbox: {
          importScripts: ["/push-handler.js"],
          globPatterns: ["**/*.{js,css,html,svg,png,ico,webp,woff2}"],
          // Do not cache navigations/HTML. OAuth redirects must always hit the
          // network, and a stale cached document can keep showing the SSR error
          // fallback after a successful Google login.
          navigateFallback: null,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.origin === self.location.origin && /\.(?:js|css|woff2)$/.test(url.pathname),
              handler: "CacheFirst",
              options: {
                cacheName: "static-assets",
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: ({ url }) => url.origin === self.location.origin && /\.(?:png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname),
              handler: "CacheFirst",
              options: {
                cacheName: "image-cache",
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
        manifest: false, // we ship public/manifest.webmanifest ourselves
      }),
    ],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
