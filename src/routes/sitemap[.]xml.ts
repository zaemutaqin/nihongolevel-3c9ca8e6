import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { interviewScenarios } from "@/lib/interview-scenarios";
import { hanashiteScenarios } from "@/lib/hanashite-scenarios";

const BASE_URL = "https://www.nihongo.live";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const SLANG_SLUGS = [
  "yabai","sugoi","kawaii","baka","daijoubu","ganbatte","uso","maji","tsundere","senpai",
  "itadakimasu","otsukare","mendokusai","moshi-moshi","sumimasen","kakkoii","natsukashii",
  "ittekimasu","tadaima","ureshii","hontou","chotto","kimochi","shouganai","kanpai",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/pricing", changefreq: "monthly", priority: "0.9" },
          { path: "/translate", changefreq: "weekly", priority: "0.9" },
          { path: "/nama-jepang", changefreq: "monthly", priority: "0.9" },
          { path: "/game-kana", changefreq: "monthly", priority: "0.8" },
          { path: "/kamus-slang", changefreq: "weekly", priority: "0.9" },
          ...SLANG_SLUGS.map((slug) => ({ path: `/kamus-slang/${slug}`, changefreq: "monthly" as const, priority: "0.7" })),
          { path: "/panduan-wisata", changefreq: "monthly", priority: "0.8" },
          { path: "/tabel-hiragana", changefreq: "monthly", priority: "0.8" },
          { path: "/interview", changefreq: "weekly", priority: "0.8" },
          ...interviewScenarios.map((s) => ({ path: `/interview/${s.id}`, changefreq: "monthly" as const, priority: "0.7" })),
          ...hanashiteScenarios.map((s) => ({ path: `/hanashite/${s.id}`, changefreq: "monthly" as const, priority: "0.7" })),
          { path: "/riwayat", changefreq: "weekly", priority: "0.5" },
          { path: "/dashboard", changefreq: "weekly", priority: "0.6" },
          { path: "/favorit", changefreq: "weekly", priority: "0.5" },
          { path: "/review", changefreq: "weekly", priority: "0.5" },
          { path: "/terms-of-service", changefreq: "yearly", priority: "0.3" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
          { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
          { path: "/refund", changefreq: "yearly", priority: "0.3" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
