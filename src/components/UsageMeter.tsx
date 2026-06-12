import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyUsage } from "@/lib/usage.functions";
import { useAuth } from "@/lib/auth";
import { useIsPro } from "@/hooks/useIsPro";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Feature = "translate" | "interview";

interface Props {
  feature: Feature;
  className?: string;
}

export function UsageMeter({ feature, className }: Props) {
  const { user, profile } = useAuth();
  const { lang } = useT();
  const isId = lang === "id";
  const fetchUsage = useServerFn(getMyUsage);

  const { data } = useQuery({
    queryKey: ["my-usage", user?.id],
    queryFn: () => fetchUsage(),
    enabled: !!user,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  if (!user) return null;
  if (profile?.is_pro) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary",
          className,
        )}
      >
        <Zap className="w-3.5 h-3.5" /> Pro · {isId ? "tanpa batas" : "unlimited"}
      </div>
    );
  }
  if (!data) return null;

  const slot = data[feature];
  const cap = slot.cap ?? 0;
  const used = Math.min(slot.used, cap);
  const remaining = Math.max(cap - slot.used, 0);
  const ratio = cap > 0 ? Math.min(slot.used / cap, 1) : 0;
  const reached = slot.used >= cap;

  const labelId =
    feature === "translate"
      ? "Terjemahan gratis hari ini"
      : "Sesi interview gratis hari ini";
  const labelEn =
    feature === "translate"
      ? "Free translations today"
      : "Free interview sessions today";

  return (
    <div className={cn("rounded-xl border border-border bg-card p-3 sm:p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
          {isId ? labelId : labelEn}
        </span>
        <span
          className={cn(
            "text-xs sm:text-sm font-bold tabular-nums",
            reached ? "text-destructive" : "text-foreground",
          )}
        >
          {used} / {cap}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all",
            reached ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {reached ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-destructive">
            {isId
              ? "Batas harian tercapai. Upgrade ke Pro untuk akses tanpa batas."
              : "Daily limit reached. Upgrade to Pro for unlimited access."}
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Zap className="w-3.5 h-3.5" />
            {isId ? "Upgrade Pro" : "Upgrade to Pro"}
          </Link>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {isId
            ? `Sisa ${remaining} hari ini · Pro = tanpa batas`
            : `${remaining} left today · Pro = unlimited`}
        </p>
      )}
    </div>
  );
}
