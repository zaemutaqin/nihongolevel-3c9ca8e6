Sprint 9 menggabungkan 4 area sekaligus. Saya bagi jadi blok kecil yang bisa dikerjakan berurutan tanpa konflik.

## 1. SEO & metadata
- Update `src/routes/__root.tsx` head sitewide (title default, description, OG default, twitter card, theme-color, canonical relative)
- Per-route head untuk `/`, `/translate`, `/interview`, `/dashboard`, `/auth` (title + description + og:title/og:description unik bahasa Indonesia)
- JSON-LD `WebApplication` di landing (`/`)
- `public/robots.txt` (Allow: /, Sitemap: nihongolevel.lovable.app/sitemap.xml)
- `src/routes/sitemap[.]xml.ts` (server route, list semua public routes)
- Audit `index.html` — pastikan tidak ada "Lovable Generated Project"

## 2. Performance & PWA
- `public/manifest.webmanifest` (name "NihongoLevel", short_name, start_url /, display standalone, theme_color, icons 192/512)
- Generate 2 icon PWA (192, 512) via imagegen
- `public/sw.js` minimal service worker (cache-first untuk static, network-first untuk API)
- Register SW di `__root.tsx` (client-only effect, hanya di production)
- Link manifest + apple-touch-icon di `__root.tsx` head

## 3. Pro tier polish
- Cek state existing: `subscriptions` table + `has_active_subscription` sudah ada, Paddle keys sudah ada
- Tambah hook `useIsPro()` membaca `subscriptions` + `profiles.is_pro` (sebagai fallback access code)
- Pasang gating yang sudah ada (UsageMeter) — tampilkan badge "Pro" di header bila aktif
- Halaman `/pricing` sederhana: 1 kartu Free vs Pro + CTA buka `UpgradeModal`
- Link "Pricing" di bottom nav untuk guest, dan di profile menu

## 4. Streak & retensi
- Migration tambah kolom di `profiles`: `streak_count int default 0`, `last_active_date date`
- Server fn `tickStreak()` dipanggil saat translate_done / interview_completed sukses (increment kalau hari berbeda dan berturut-turut, reset kalau gap > 1 hari)
- Widget `StreakBadge` (🔥 N hari) di dashboard + top bar landing kalau login
- Empty-state copy di dashboard mention streak

## Catatan
- TIDAK menambah push notification web (butuh VAPID + backend kompleks, skip)
- TIDAK mengubah pricing Paddle (catalog sudah dikelola user)
- Email reminder harian di-skip (butuh cron + email infra setup lebih besar — bisa jadi Sprint 10)

## Urutan eksekusi
1. SEO files (paralel: robots.txt, sitemap, root head, per-route head)
2. PWA (icon generate → manifest → SW → register)
3. Streak migration → server fn → hook ke translate/interview → widget
4. Pricing page + useIsPro hook + Pro badge
5. Build check
