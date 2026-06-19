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
  ChevronRight,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { getInterviewScenario, getScenarioHints, type ScenarioHint } from "@/lib/interview-scenarios";
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
  const [phase, setPhase] = useState<"briefing" | "chat">("briefing");

  const recogRef = useRef<SR | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const hints: ScenarioHint[] = scenario ? getScenarioHints(scenario.id) : [];
  const isGuestDemo = !user && scenario?.id === "iv_kaigo";
  const userTurnCount = messages.filter((m) => m.role === "user").length;
  const guestLimitReached = isGuestDemo && userTurnCount >= 3;

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

  // Block non-Kaigo scenarios for guests
  if (!user && scenario.id !== "iv_kaigo") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="mb-4">{isId ? "Masuk dulu untuk berlatih skenario ini." : "Sign in to practice this scenario."}</p>
        <Link to="/interview" className="text-violet-700 underline">
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
      gtagEvent("interview_completed", {
        scenario: scenario.id,
        avg_score: String(
          Math.round(
            ((j.evaluation?.grammar_score ?? 0) +
              (j.evaluation?.naturalness_score ?? 0) +
              (j.evaluation?.confidence_score ?? 0)) /
              3,
          ),
        ),
      });
    } catch (e) {
      const code = (e as Error)?.message || "AI_UNAVAILABLE";
      setError(friendlyError(code, isId));
    } finally {
      setEvaluating(false);
    }
  };

  const retryLastMessage = async () => {
    setError(null);
    // Remove last assistant placeholder if any, then resend last user msg
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // Trim trailing user message and re-trigger send by setting input
    setMessages((m) => m.filter((x) => x.id !== lastUser.id));
    setInput(lastUser.content);
    setTimeout(() => send(), 50);
  };


  // ===== Briefing screen =====
  if (phase === "briefing") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <button
          onClick={() => navigate({ to: "/interview" })}
          className="inline-flex items-center gap-1 text-sm text-violet-700 hover:text-violet-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {isId ? "Kembali" : "Back"}
        </button>

        <div className="rounded-2xl bg-violet-100 border border-violet-200 p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="text-4xl">{scenario.emoji}</div>
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-violet-900 text-white px-2 py-0.5 rounded-md mb-2">
                {isId ? "Situasi" : "Situation"} · {scenario.level}
              </span>
              <h1 className="text-2xl font-bold text-violet-900 leading-tight">
                {isId ? scenario.title_id : scenario.title_en}
              </h1>
              <p className="text-sm text-violet-900/80 mt-1">
                {isId ? scenario.role_id : scenario.role_en}
              </p>
            </div>
          </div>

          <p className="text-sm text-violet-900/90 leading-relaxed mb-6">
            {isId ? scenario.description_id : scenario.description_en}
          </p>

          <div className="mb-6">
            <p className="text-[11px] uppercase font-bold tracking-wider text-violet-900/70 mb-2">
              {isId ? "Kalimat starter yang bisa kamu pakai" : "Starter phrases you can use"}
            </p>
            <div className="flex flex-wrap gap-2">
              {hints.map((h, i) => (
                <span
                  key={i}
                  className="inline-flex flex-col items-start rounded-xl bg-white border border-violet-200 px-3 py-2 text-sm"
                  style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
                >
                  <span className="text-violet-900">{h.jp}</span>
                  <span className="text-[10px] italic text-muted-foreground mt-0.5">{h.ro}</span>
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase("chat")}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-400 px-5 py-3 text-sm font-bold text-violet-900 transition"
          >
            {isId ? "Mulai interview" : "Start interview"} <ChevronRight className="w-4 h-4" />
          </button>

          {isGuestDemo && (
            <p className="mt-3 text-center text-xs text-violet-900/70">
              {isId
                ? "Demo gratis — 3 pertanyaan pertama bisa dijawab tanpa login."
                : "Free demo — answer your first 3 questions without signing in."}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ===== Chat screen =====
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
          <h1 className="font-bold text-sm truncate text-violet-900">
            {isId ? scenario.title_id : scenario.title_en}
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            {isId ? scenario.role_id : scenario.role_en} · {scenario.level}
          </p>
        </div>
        {isGuestDemo && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-lime-500 text-violet-900 px-2 py-1 rounded-full">
            {isId ? `Demo ${userTurnCount}/3` : `Demo ${userTurnCount}/3`}
          </span>
        )}
      </header>


      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}
          >
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm flex-shrink-0">
                {scenario.emoji}
              </div>
            )}
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-violet-600 text-white rounded-br-sm"
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
                    speaking === m.id && "text-violet-700",
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
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm flex-shrink-0">
              {scenario.emoji}
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs">
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
            <button
              onClick={retryLastMessage}
              className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:bg-muted"
            >
              {isId ? "Coba lagi" : "Retry"}
            </button>
          </div>
        )}


        {evaluation && (
          <div className="mt-6 rounded-2xl border-2 border-violet-300 bg-violet-50 p-5 space-y-4">
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

      <div className="border-t border-border pt-3 pb-2 space-y-3">
        {guestLimitReached && !evaluation ? (
          <div className="rounded-2xl bg-violet-100 border border-violet-300 p-4 text-center">
            <Lock className="w-5 h-5 mx-auto text-violet-700 mb-1" />
            <p className="text-sm font-bold text-violet-900">
              {isId ? "Daftar gratis untuk lanjutkan & simpan progresmu" : "Sign up free to continue & save your progress"}
            </p>
            <p className="text-xs text-violet-900/70 mt-1 mb-3">
              {isId
                ? "Kamu sudah menjawab 3 pertanyaan demo. Lanjutkan tanpa batas setelah daftar."
                : "You've answered 3 demo questions. Continue without limits after signing up."}
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-xl bg-lime-500 hover:bg-lime-400 px-4 py-2 text-sm font-bold text-violet-900 transition"
            >
              {isId ? "Daftar gratis" : "Sign up free"} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Hint chips */}
            {hints.length > 0 && !evaluation && (
              <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
                {hints.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInput((p) => (p ? p + " " + h.jp : h.jp))}
                    className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 hover:bg-violet-100 px-3 py-1.5 text-xs transition"
                    style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
                    title={h.ro}
                  >
                    <span className="text-violet-900">{h.jp}</span>
                  </button>
                ))}
              </div>
            )}

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
                className="flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300 max-h-32"
                style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="p-3 rounded-full bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition flex-shrink-0"
                aria-label="Send"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Finish button — small, below input */}
            {user && !evaluation && (
              <div className="flex justify-center pt-1">
                <button
                  onClick={finishInterview}
                  disabled={evaluating}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 hover:text-violet-900 underline underline-offset-2 disabled:opacity-50"
                >
                  {evaluating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isId ? "Akhiri sesi & lihat evaluasi" : "End session & view evaluation"}
                </button>
              </div>
            )}
          </>
        )}
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
