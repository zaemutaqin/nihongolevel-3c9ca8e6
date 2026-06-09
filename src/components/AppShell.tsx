import { Link, Outlet } from "@tanstack/react-router";
import { Home, Search, History, Star, BarChart3, RotateCw, Lock } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useT, setLang, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { gtagEvent } from "@/lib/gtag";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";
import { UpgradeSuccessListener } from "./UpgradeSuccessListener";
import { SiteFooter } from "./SiteFooter";

import { UserMenu } from "./UserMenu";

type NavItem = { to: string; key: string; Icon: typeof Search; exact?: boolean; proOnly?: boolean };
const NAV: NavItem[] = [
  { to: "/", key: "home", Icon: Home, exact: true },
  { to: "/riwayat", key: "history", Icon: History, proOnly: true },
  { to: "/favorit", key: "favorites", Icon: Star, proOnly: true },
  { to: "/dashboard", key: "dashboard", Icon: BarChart3, proOnly: true },
  { to: "/review", key: "review", Icon: RotateCw, proOnly: true },
];

function LangToggle({ lang }: { lang: Lang }) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={() => {
          setLang("id");
          gtagEvent("language_switch", { language: "id" });
        }}
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-base leading-none transition ring-offset-background",
          lang === "id" ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100",
        )}
        aria-pressed={lang === "id"}
        aria-label="Bahasa Indonesia"
        title="Bahasa Indonesia"
      >
        🇮🇩
      </button>
      <button
        onClick={() => {
          setLang("en");
          gtagEvent("language_switch", { language: "en" });
        }}
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-base leading-none transition ring-offset-background",
          lang === "en" ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100",
        )}
        aria-pressed={lang === "en"}
        aria-label="English"
        title="English"
      >
        🇬🇧
      </button>
    </div>
  );
}

export function AppShell() {
  const { t, lang } = useT();
  const { loading, profile } = useAuth();
  const isPro = !!profile?.is_pro;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <PaymentTestModeBanner />
      <UpgradeSuccessListener />
      <Toaster />
      {/* Desktop top nav */}
      <nav className="hidden sm:flex sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-3xl w-full px-4 py-3 flex items-center gap-1">
          <Link to="/" className="font-bold text-lg mr-4 inline-flex items-center gap-2">
            <span>Nihongo<span className="text-primary">Level</span></span>
            <ProBadgeInline />
          </Link>
          <div className="flex gap-1">
            {NAV.map(({ to, key, Icon, exact, proOnly }) => {
              const locked = proOnly && !isPro;
              return (
                <Link
                  key={to}
                  to={to}
                  activeOptions={{ exact: !!exact }}
                  activeProps={{ className: "bg-primary text-primary-foreground" }}
                  inactiveProps={{ className: "text-foreground/70 hover:bg-muted" }}
                  className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                >
                  <Icon className="w-4 h-4" />
                  {t(`nav.${key}_short`)}
                  {locked && (
                    <Lock className="w-3 h-3 text-muted-foreground" aria-label="Pro" />
                  )}
                </Link>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <LangToggle lang={lang} />
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="sm:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/90 backdrop-blur">
        <Link to="/" className="font-bold inline-flex items-center gap-2">
          <span>Nihongo<span className="text-primary">Level</span></span>
          <ProBadgeInline />
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle lang={lang} />
          <UserMenu />
        </div>
      </div>

      <main className="pb-24 sm:pb-10">
        <Outlet />
      </main>

      <div className="hidden sm:block">
        <SiteFooter />
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="grid grid-cols-5">
          {NAV.map(({ to, key, Icon, exact, proOnly }) => {
            const locked = proOnly && !isPro;
            return (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: !!exact }}
                activeProps={{ className: "text-primary" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium"
              >
                <span className="relative">
                  <Icon className="w-5 h-5" />
                  {locked && (
                    <Lock className="absolute -top-1 -right-2 w-3 h-3 text-muted-foreground" />
                  )}
                </span>
                {t(`nav.${key}_short`)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ProBadgeInline() {
  const { profile } = useAuth();
  if (!profile?.is_pro) return null;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 text-[10px] font-bold uppercase">
      Pro ✓
    </span>
  );
}
