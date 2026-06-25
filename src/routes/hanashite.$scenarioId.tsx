import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { getScenario } from "@/lib/hanashite-scenarios";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { gtagEvent } from "@/lib/gtag";

type Msg = { role: "user" | "assistant"; content: string; id: string };
type Feedback = {
  politeness_score: number;
  politeness_note: string;
  grammar: { issue: string; correction: string; explanation: string }[];
  strengths: string[];
  next_step: string;
};

// Web Speech API types (browser-only)
type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export const Route = createFileRoute("/hanashite/$scenarioId")({
  head: ({ params }) => {
    const s = getScenario(params.scenarioId);
    const title = s ? `${s.title_en} — Hanashite Room` : "Hanashite Room";
    return {
      meta: [
        { title: `${title} | Nihongolive` },
        { name: "description", content: s?.situation_en ?? "Latih bicara Jepang dengan AI." },
        { name: "robots", content: "noindex" }, // chat page is dynamic / per-user
      ],
    };
  },
  component: HanashitePlay,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <p>Scenario not found.</p>
      <Link to="/" className="text-primary underline">
        Back
      </Link>
    </div>
  ),
});

function HanashitePlay() {
  const { scenarioId } = Route.useParams();
  const scenario = getScenario(scenarioId);
  const { lang } = useT();
  const { user, profile } = useAuth();
  const isPro = !!profile?.is_pro;
  const isId = lang === "id";
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const recogRef = useRef<SR | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Seed conversation with AI's first line.
  useEffect(() => {
    if (!scenario) return;
    setMessages([
      {
        id: "init",
        role: "assistant",
        content: scenario.ai_first_japanese,
      },
    ]);
  }, [scenario]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (!scenario) return null;

  // Block guests and non-Pro for locked scenarios
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="mb-4">
          {isId ? "Masuk dulu untuk berlatih." : "Sign in to practice."}
        </p>
        <Link to="/" className="text-primary underline">
          {isId ? "Kembali" : "Back"}
        </Link>
      </div>
    );
  }
  if (!scenario.free && !isPro) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="mb-4">{isId ? "Skenario ini khusus Pro." : "This scenario is Pro-only."}</p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          {isId ? "Upgrade" : "Upgrade"}
        </Link>
      </div>
    );
  }

  const speak = (text: string, id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error(isId ? "Browsermu tidak support suara." : "Your browser does not support speech.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    utter.rate = 0.9;
    utter.pitch = 1.0;
    // Try a Japanese voice
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find((v) => v.lang.startsWith("ja"));
    if (jaVoice) utter.voice = jaVoice;
    utter.onstart = () => setSpeaking(id);
    utter.onend = () => setSpeaking(null);
    utter.onerror = () => setSpeaking(null);
    window.speechSynthesis.speak(utter);
  };

  const startRecording = () => {
    if (typeof window === "undefined") return;
    const W = window as unknown as {
      SpeechRecognition?: new () => SR;
      webkitSpeechRecognition?: new () => SR;
    };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error(
        isId
          ? "Browsermu tidak support mic. Coba pakai Chrome di desktop."
          : "Your browser does not support speech recognition. Try desktop Chrome.",
      );
      return;
    }
    const recog = new Ctor();
    recog.lang = "ja-JP";
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (ev) => {
      const transcript = ev.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recog.onerror = (ev) => {
      console.warn("speech error:", ev.error);
      if (ev.error === "not-allowed") {
        toast.error(isId ? "Izinkan akses mic dulu." : "Please allow microphone access.");
      }
    };
    recog.onend = () => setRecording(false);
    recogRef.current = recog;
    setRecording(true);
    try {
      recog.start();
    } catch {
      setRecording(false);
    }
  };

  const stopRecording = () => {
    recogRef.current?.stop();
    setRecording(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    setFeedback(null);
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    gtagEvent("hanashite_message", { scenario: scenario.id });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const res = await fetch("/api/hanashite", {
        method: "POST",
        headers,
        body: JSON.stringify({
          scenarioId: scenario.id,
          mode: "chat",
          lang,
          messages: next.filter((m) => m.id !== "init" || true).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "AI_UNAVAILABLE");
      }
      const j = await res.json();
      const reply = j.reply as string;
      const aiMsg: Msg = { id: crypto.randomUUID(), role: "assistant", content: reply };
      setMessages((m) => [...m, aiMsg]);
      // Auto-speak the AI's reply
      setTimeout(() => speak(reply, aiMsg.id), 150);
    } catch (e) {
      const code = (e as Error)?.message || "AI_UNAVAILABLE";
      setError(
        code === "RATE_LIMITED"
          ? isId
            ? "Terlalu banyak permintaan. Coba lagi nanti."
            : "Too many requests. Try again later."
          : code === "CREDITS_EXHAUSTED"
            ? isId
              ? "Kredit AI habis. Coba lagi nanti."
              : "AI credits exhausted. Try later."
            : isId
              ? "AI tidak tersedia. Coba lagi."
              : "AI unavailable. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const requestFeedback = async () => {
    if (feedbackLoading) return;
    const userTurns = messages.filter((m) => m.role === "user");
    if (userTurns.length === 0) {
      toast.error(isId ? "Bicara dulu minimal sekali." : "Send at least one message first.");
      return;
    }
    setFeedbackLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch("/api/hanashite", {
        method: "POST",
        headers,
        body: JSON.stringify({
          scenarioId: scenario.id,
          mode: "feedback",
          lang,
          messages: messages.filter((m) => m.id !== "init").map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      if (!res.ok) throw new Error("AI_UNAVAILABLE");
      const j = await res.json();
      setFeedback(j.feedback as Feedback);
      gtagEvent("hanashite_feedback", { scenario: scenario.id });
    } catch {
      setError(isId ? "Gagal mendapat feedback." : "Failed to get feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 sm:py-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <header className="flex items-center gap-3 pb-3 border-b border-border">
        <button
          onClick={() => navigate({ to: "/" })}
          className="p-1.5 rounded-md hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-2xl">{scenario.emoji}</div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm truncate">
            {isId ? scenario.title_id : scenario.title_en}
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            {isId ? scenario.role_id : scenario.role_en} · {isId ? scenario.tone_id : scenario.tone_en}
          </p>
        </div>
        <button
          onClick={requestFeedback}
          disabled={feedbackLoading}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition disabled:opacity-50"
        >
          {feedbackLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {isId ? "Feedback" : "Feedback"}
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}
          >
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm flex-shrink-0">
                {scenario.emoji}
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border rounded-bl-sm",
              )}
              style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              {m.role === "assistant" && (
                <button
                  onClick={() => speak(m.content, m.id)}
                  className={cn(
                    "mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition",
                    speaking === m.id && "text-primary",
                  )}
                >
                  <Volume2 className="w-3 h-3" />
                  {speaking === m.id
                    ? isId ? "berbicara..." : "speaking..."
                    : isId ? "dengar" : "play"}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm flex-shrink-0">
              {scenario.emoji}
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {feedback && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm inline-flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                {isId ? "Feedback AI" : "AI Feedback"}
              </h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{feedback.politeness_score}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {isId ? "Kesopanan" : "Politeness"}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{feedback.politeness_note}</p>
            {feedback.strengths?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
                  {isId ? "Yang Bagus" : "Strengths"}
                </h4>
                <ul className="space-y-1">
                  {feedback.strengths.map((s, i) => (
                    <li key={i} className="text-xs flex gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.grammar?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
                  {isId ? "Koreksi" : "Corrections"}
                </h4>
                <ul className="space-y-2">
                  {feedback.grammar.map((g, i) => (
                    <li key={i} className="text-xs rounded-md bg-background p-2 border border-border">
                      <div className="line-through text-muted-foreground">{g.issue}</div>
                      <div className="font-semibold text-foreground">→ {g.correction}</div>
                      <div className="mt-1 text-muted-foreground">{g.explanation}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.next_step && (
              <div className="rounded-md bg-background p-2 border border-border text-xs">
                <span className="font-bold">{isId ? "Langkah berikut: " : "Next: "}</span>
                {feedback.next_step}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border pt-3 pb-2">
        <div className="flex items-end gap-2">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={cn(
              "p-2.5 rounded-full border transition flex-shrink-0",
              recording
                ? "bg-destructive text-destructive-foreground border-destructive animate-pulse"
                : "bg-background border-border hover:bg-muted",
            )}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              recording
                ? isId ? "🎙️ Mendengarkan..." : "🎙️ Listening..."
                : isId ? "Ketik atau tekan mic..." : "Type or tap mic..."
            }
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 max-h-32"
            style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition flex-shrink-0"
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          {isId
            ? "Tekan mic untuk bicara langsung dalam bahasa Jepang. AI akan membalas suara."
            : "Tap mic to speak Japanese directly. AI replies with voice."}
        </p>
      </div>
    </div>
  );
}
