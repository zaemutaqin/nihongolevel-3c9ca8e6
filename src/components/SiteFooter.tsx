import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";

export function SiteFooter() {
  const lang = useLang();
  return (
    <footer className="border-t border-border bg-background/60">
      <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} zaenal mutaqin · NihongoLevel</div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link to="/pricing" className="hover:text-foreground transition">
            {lang === "id" ? "Harga" : "Pricing"}
          </Link>
          <Link to="/terms" className="hover:text-foreground transition">
            {lang === "id" ? "Syarat & Ketentuan" : "Terms"}
          </Link>
          <Link to="/privacy" className="hover:text-foreground transition">
            {lang === "id" ? "Privasi" : "Privacy"}
          </Link>
          <Link to="/refund" className="hover:text-foreground transition">
            {lang === "id" ? "Pengembalian Dana" : "Refunds"}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
