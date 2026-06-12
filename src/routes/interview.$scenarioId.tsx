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
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { getInterviewScenario } from "@/lib/interview-scenarios";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { gtagEvent } from "@/lib/gtag";

type Msg = { role: "user" | "assistant"; content: string; id: string };
type Suggestion = { point: string; detail: string };
type Evaluation = {
  grammar_score: number;
  naturalness_score: number;
  confidence_score: number;
  vocabulary_level: string;
  summary: string;
  suggestions: Suggestion[];
};

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

export const Route = createFileRoute("/interview/$scenarioId")({
  head: ({ params }) => {
    const s = getInterviewScenario(params.scenarioId);
    return {
      meta: [
        { title: s ? `${s.title_en} — Interview Simulator | NihongoLevel` : "Interview Simulator" },
        { name: "description", content: s?.description_en ?? "Latih wawancara Jepang dengan AI." },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: InterviewPlay,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <p>Scenario not found.</p>
      <Link to="/interview" className="text-primary underline">
        Back
      </Link>
    </div>
  ),
});

function InterviewPlay() {
  const { scenarioId } = Route.useParams();
  const scenario = getInterviewScenario(scenarioId);
  const { lang } = useT();
  const { user } = useAuth();
  const isId = lang === "id";
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const recogRef = useRef<SR | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scenario) return;
    setMessages([
      { id: "init", role: "assistant", content: scenario.ai_opening_japanese },
    ]);
  }, [scenario]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, evaluation]);

  if (!scenario) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="mb-4">{isId ? "Masuk dulu untuk berlatih." : "Sign in to practice."}</p>
        <Link to="/interview" className="text-primary underline">
          {isId ? "Kembali" : "Back"}
        </Link>
      </div>
    );
  }

  const speak = (text: string, id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    utter.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const ja = voices.find((v) => v.lang.startsWith("ja"));
    if (ja) utter.voice = ja;
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
      toast.error(isId ? "Browsermu tidak support mic." : "Speech recognition not supported.");
      return;
    }
    const r = new Ctor();
    r.lang = "ja-JP";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (ev) => {
      const txt = ev.results[0][0].transcript;
      setInput((p) => (p ? p + " " + txt : txt));
    };
    r.onerror = () => setRecording(false);
    r.onend = () => setRecording(false);
    recogRef.current = r;
    setRecording(true);
    try {
      r.start();
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
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    gtagEvent("interview_message", { scenario: scenario.id });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const res = await fetch("/api/interview", {
        method: "POST",
        headers,
        body: JSON.stringify({
          scenarioId: scenario.id,
          mode: "chat",
          lang,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
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
      setTimeout(() => speak(reply, aiMsg.id), 150);
    } catch (e) {
      const code = (e as Error)?.message || "AI_UNAVAILABLE";
      setError(friendlyError(code, isId));
    } finally {
      setLoading(false);
    }
  };

  const finishInterview = async () => {
    if (evaluating) return;
    const userTurns = messages.filter((m) => m.role === "user");
    if (userTurns.length < 2) {
      toast.error(
        isId
          ? "Latihan dulu minimal 2 jawaban sebelum minta evaluasi."
          : "Answer at least 2 questions before finishing.",
      );
      return;
    }
    setEvaluating(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch("/api/interview", {
        method: "POST",
        headers,
        body: JSON.stringify({
          scenarioId: scenario.id,
          mode: "feedback",
          lang,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "AI_UNAVAILABLE");
      }
      const j = await res.json();
      setEvaluation(j.evaluation as Evaluation);
      gtagEvent("interview_feedback", { scenario: scenario.id });
    } catch (e) {
      const code = (e as Error)?.message || "AI_UNAVAILABLE";
      setError(friendlyError(code, isId));
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 sm:py-6 flex flex-col h-[calc(100vh-6rem)]">
      <header className="flex items-center gap-3 pb-3 border-b border-border">
        <button
          onClick={() => navigate({ to: "/interview" })}
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
            {isId ? scenario.role_id : scenario.role_en} · {scenario.level}
          </p>
        </div>
        <button
          onClick={finishInterview}
          disabled={evaluating}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
        >
          {evaluating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {isId ? "Selesai & Evaluasi" : "Finish & Evaluate"}
        </button>
      </header>

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
                "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm",
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
                    ? isId
                      ? "berbicara..."
                      : "speaking..."
                    : isId
                      ? "dengar"
                      : "play"}
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

        {evaluation && (
          <div className="mt-6 rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h3 className="font-bold">{isId ? "Hasil Evaluasi" : "Evaluation Result"}</h3>
              {evaluation.vocabulary_level && (
                <span className="ml-auto rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold">
                  {evaluation.vocabulary_level}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ScoreBox label={isId ? "Grammar" : "Grammar"} score={evaluation.grammar_score} />
              <ScoreBox
                label={isId ? "Natural" : "Natural"}
                score={evaluation.naturalness_score}
              />
              <ScoreBox
                label={isId ? "Confidence" : "Confidence"}
                score={evaluation.confidence_score}
              />
            </div>

            {evaluation.summary && (
              <p className="text-sm leading-relaxed text-foreground/90">{evaluation.summary}</p>
            )}

            {evaluation.suggestions?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                  {isId ? "Saran Perbaikan" : "Suggestions"}
                </h4>
                <ul className="space-y-2">
                  {evaluation.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">{s.point}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">{s.detail}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                to="/interview"
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
              >
                {isId ? "Kembali ke daftar" : "Back to list"}
              </Link>
              <button
                onClick={() => {
                  setEvaluation(null);
                  setMessages([
                    {
                      id: "init",
                      role: "assistant",
                      content: scenario.ai_opening_japanese,
                    },
                  ]);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold hover:opacity-90"
              >
                {isId ? "Mulai Ulang" : "Restart"}
              </button>
            </div>
          </div>
        )}
      </div>

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
            aria-label={recording ? "Stop" : "Record"}
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
                ? isId
                  ? "🎙️ Mendengarkan..."
                  : "🎙️ Listening..."
                : isId
                  ? "Jawab dalam bahasa Jepang..."
                  : "Answer in Japanese..."
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
      </div>
    </div>
  );
}

function ScoreBox({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-primary" : "text-amber-600";
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-center">
      <div className={cn("text-3xl font-extrabold tabular-nums", color)}>{score}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function friendlyError(code: string, isId: boolean): string {
  if (code === "DAILY_LIMIT") {
    return isId
      ? "Batas harian tercapai (2 sesi/hari untuk akun gratis). Upgrade ke Pro untuk unlimited."
      : "Daily limit reached (2 sessions/day on free). Upgrade to Pro for unlimited.";
  }
  if (code === "RATE_LIMITED") {
    return isId ? "Terlalu banyak permintaan. Coba lagi nanti." : "Too many requests.";
  }
  if (code === "CREDITS_EXHAUSTED") {
    return isId ? "Kredit AI habis. Coba lagi nanti." : "AI credits exhausted.";
  }
  if (code === "AUTH_REQUIRED") {
    return isId ? "Silakan masuk terlebih dahulu." : "Please sign in first.";
  }
  return isId ? "AI tidak tersedia. Coba lagi." : "AI unavailable. Try again.";
}
