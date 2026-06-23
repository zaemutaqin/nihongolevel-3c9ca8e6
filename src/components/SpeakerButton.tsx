import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { speakJapanese, isTtsAvailable, onVoiceReady, getJapaneseVoice } from "@/lib/tts";

export function SpeakerButton({
  text,
  size = "md",
  className,
}: {
  text: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!isTtsAvailable()) {
      setAvailable(false);
      return;
    }
    // Trigger voice load — getJapaneseVoice() may be null on first paint.
    if (!getJapaneseVoice()) {
      const off = onVoiceReady(() => {
        /* voice now cached */
      });
      return off;
    }
  }, []);

  const handleClick = () => {
    if (!text || speaking) return;
    speakJapanese(text, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const dims = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const icon = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  const title = available
    ? speaking
      ? "Sedang mengucapkan..."
      : "Dengarkan"
    : "Suara Jepang tidak tersedia di perangkat ini";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={speaking || !available}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border bg-background text-foreground/80 hover:bg-muted transition flex-shrink-0",
        "disabled:opacity-60",
        speaking && "animate-pulse bg-primary/10 text-primary border-primary/40",
        dims,
        className,
      )}
    >
      <Volume2 className={icon} />
    </button>
  );
}
