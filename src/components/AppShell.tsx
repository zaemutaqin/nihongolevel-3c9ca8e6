import { Link, Outlet } from "@tanstack/react-router";
import { Search, History, Star, BarChart3, RotateCw } from "lucide-react";

type NavItem = { to: string; label: string; Icon: typeof Search; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/", label: "Cari", Icon: Search, exact: true },
  { to: "/riwayat", label: "Riwayat", Icon: History },
  { to: "/favorit", label: "Favorit", Icon: Star },
  { to: "/dashboard", label: "Perjalanan", Icon: BarChart3 },
  { to: "/review", label: "Latihan", Icon: RotateCw },
];


export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Desktop top nav */}
      <nav className="hidden sm:flex sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-3xl w-full px-4 py-3 flex items-center gap-1">
          <Link to="/" className="font-bold text-lg mr-4">
            Nihongo<span className="text-primary">Level</span>
          </Link>
          <div className="flex gap-1">
            {NAV.map(({ to, label, Icon, exact }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: !!exact }}
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                inactiveProps={{ className: "text-foreground/70 hover:bg-muted" }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="pb-24 sm:pb-10">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="grid grid-cols-5">
          {NAV.map(({ to, label, Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: !!exact }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium"
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
