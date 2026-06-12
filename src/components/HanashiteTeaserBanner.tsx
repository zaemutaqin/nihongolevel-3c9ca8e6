import { Link } from "@tanstack/react-router";
import { Mic, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

const DISMISS_KEY = "hanashite_teaser_dismissed_v1";

// Passive corner banner — promotes Hanashite Room on free-tier pages.
// Stays out of the way (small, bottom-right, dismissible).
export function HanashiteTeaserBanner() {
  const { lang } = useT();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  const isId = lang === "id";

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-40 max-w-[280px] animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative rounded-2xl border border-border bg-card shadow-lg p-3 pr-8">
        <button
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setShow(false);
          }}
          className="absolute top-1.5 right-1.5 p-1 rounded-full text-muted-foreground hover:bg-muted transition"
          aria-label={isId ? "Tutup" : "Close"}
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <Link
          to="/"
          className="flex items-start gap-2.5"
          onClick={() => {
            // Don't auto-dismiss on click; let user come back later.
          }}
        >
          <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-snug">
              {isId ? "Sudah hafal hurufnya?" : "Done with the basics?"}
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
              {isId
                ? "Latih bicara langsung dengan AI di Hanashite Room."
                : "Practice speaking with AI in Hanashite Room."}
            </p>
            <span className="mt-1.5 inline-block text-[11px] font-semibold text-primary hover:underline">
              {isId ? "Coba gratis →" : "Try free →"}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
