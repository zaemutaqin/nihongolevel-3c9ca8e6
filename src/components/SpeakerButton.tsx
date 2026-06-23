import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

let cachedJaVoice: SpeechSynthesisVoice | null | undefined = undefined;

function pickJaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (cachedJaVoice !== undefined) return cachedJaVoice;
  const voices = window.speechSynthesis.getVoices();
  const ja = voices.find((v) => v.lang?.toLowerCase().startsWith("ja")) ?? null;
  if (voices.length > 0) cachedJaVoice = ja;
  return ja;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  // Voices load asynchronously in some browsers
  window.speechSynthesis.onvoiceschanged = () => {
    cachedJaVoice = undefined;
    pickJaVoice();
  };
}

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
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setAvailable(false);
      return;
    }
    // trigger voice loading
    pickJaVoice();
  }, []);

  const handleClick = () => {
    if (!text || !("speechSynthesis" in window) || speaking) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.9;
      utterance.pitch = 1;
      const ja = pickJaVoice();
      if (ja) utterance.voice = ja;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeaking(false);
    }
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
