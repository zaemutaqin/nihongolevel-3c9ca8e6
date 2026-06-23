import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
  Languages,
  Type as TypeIcon,
  ListChecks,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as wanakana from "wanakana";
import {
  getInterviewScenario,
  getScenarioHints,
  type ScenarioHint,
} from "@/lib/interview-scenarios";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { gtagEvent } from "@/lib/gtag";
import { getCurriculumOverview } from "@/lib/curriculum.functions";
import { speakJapanese } from "@/lib/tts";
import { getGuestFingerprint } from "@/lib/guest-fingerprint";

// ===== Types =====
type LangMode = "translate" | "romaji" | "fullJp";
type AnswerMode = "mcq" | "mic" | "type";

type McqOption = { text: string; romaji?: string; feedback?: string };

type AssistantMsg = {
  role: "assistant";
  id: string;
  japanese: string;
  romaji?: string | null;
  translation?: string | null;
  options?: McqOption[] | null;
  correctIndex?: number;
  // Snapshot of langMode at the moment this message was received — not retroactive.
  displayMode: LangMode;
  // MCQ feedback (locally recorded after user picks an option for THIS message).
  pickedIndex?: number;
};
type UserMsg = { role: "user"; id: string; content: string };
type Msg = AssistantMsg | UserMsg;

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
  onresult:
    | ((ev: {
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }>;
      }) => void)
    | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

// ===== localStorage keys =====
const LS_LANG_MODE = "nihongolevel_interview_lang_mode";
const LS_ANSWER_MODE = "nihongolevel_interview_answer_mode";

function loadLangModePref(): LangMode | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(LS_LANG_MODE);
  return v === "translate" || v === "romaji" || v === "fullJp" ? v : null;
}
function loadAnswerModePref(): AnswerMode | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(LS_ANSWER_MODE);
  return v === "mcq" || v === "mic" || v === "type" ? v : null;
}
function defaultLangModeForLevel(order: number | null): LangMode {
  if (order == null || order <= 1) return "translate";
  if (order <= 3) return "romaji";
  return "fullJp";
}

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
      <Link to="/interview" className="text-violet-700 underline">
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

  // ===== Curriculum (for default langMode) =====
  const fetchOverview = useServerFn(getCurriculumOverview);
  const overviewQ = useQuery({
    queryKey: ["curriculum-overview", user?.id ?? "anon"],
    queryFn: () => fetchOverview(),
    enabled: !!user,
    staleTime: 60_000,
  });
  const currentLevelOrder = useMemo(() => {
    const lv = overviewQ.data?.levels.find((l) => l.status === "current");
    return lv?.order_index ?? null;
  }, [overviewQ.data]);

  // ===== Mode state =====
  const [langMode, setLangModeRaw] = useState<LangMode>("translate");
  const [answerMode, setAnswerModeRaw] = useState<AnswerMode>("type");
  // Hydrate from localStorage / level default on first mount.
  useEffect(() => {
    const lmPref = loadLangModePref();
    setLangModeRaw(lmPref ?? defaultLangModeForLevel(currentLevelOrder));
    const amPref = loadAnswerModePref();
    if (amPref) setAnswerModeRaw(amPref);
    // run once when level data lands
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevelOrder]);
  const setLangMode = (m: LangMode) => {
    setLangModeRaw(m);
    try {
      window.localStorage.setItem(LS_LANG_MODE, m);
    } catch {}
  };
  const setAnswerMode = (m: AnswerMode) => {
    // Auto-fallback to type if mic isn't supported.
    if (m === "mic" && typeof window !== "undefined") {
      const W = window as unknown as {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: unknown;
      };
      if (!W.SpeechRecognition && !W.webkitSpeechRecognition) {
        toast.error(
          isId
            ? "Browser ini tidak mendukung input suara. Pakai mode ketik."
            : "This browser doesn't support voice input. Use type mode.",
        );
        m = "type";
      }
    }
    setAnswerModeRaw(m);
    try {
      window.localStorage.setItem(LS_ANSWER_MODE, m);
    } catch {}
  };

  // ===== Chat state =====
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [phase, setPhase] = useState<"setup" | "chat">("setup");
  const [openerOptionsLoading, setOpenerOptionsLoading] = useState(false);

  // Mic state
  const [recording, setRecording] = useState(false);
  const [micPreview, setMicPreview] = useState<string>("");
  const recogRef = useRef<SR | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const hints: ScenarioHint[] = scenario ? getScenarioHints(scenario.id) : [];
  const isGuestDemo = !user && scenario?.id === "iv_kaigo";
  const userTurnCount = messages.filter((m) => m.role === "user").length;
  const guestLimitReached = isGuestDemo && userTurnCount >= 3;

  // Initialize first assistant message from scenario opener.
  useEffect(() => {
    if (!scenario) return;
    setMessages([
      {
        id: "init",
        role: "assistant",
        japanese: scenario.ai_opening_japanese,
        romaji: scenario.ai_opening_romaji,
        translation: null,
        options: null,
        correctIndex: 0,
        displayMode: langMode,
      },
    ]);
    // We intentionally don't depend on langMode here — opener snapshot is fixed at scenario load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, evaluation]);

  if (!scenario) return null;

  // Block non-Kaigo scenarios for guests
  if (!user && scenario.id !== "iv_kaigo") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="mb-4">
          {isId ? "Masuk dulu untuk berlatih skenario ini." : "Sign in to practice this scenario."}
        </p>
        <Link to="/interview" className="text-violet-700 underline">
          {isId ? "Kembali" : "Back"}
        </Link>
      </div>
    );
  }

  // ===== Audio =====
  const speak = (text: string, id: string) => {
    speakJapanese(text, {
      rate: 0.95,
      onStart: () => setSpeaking(id),
      onEnd: () => setSpeaking(null),
      onError: () => setSpeaking(null),
    });
  };


  // ===== Web Speech recognition =====
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
          ? "Browser ini tidak mendukung input suara. Gunakan mode ketik sebagai gantinya."
          : "This browser doesn't support voice input. Use type mode instead.",
      );
      setAnswerMode("type");
      return;
    }
    const r = new Ctor();
    r.lang = "ja-JP";
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (ev) => {
      let interim = "";
      let finalText = "";
      for (let i = 0; i < ev.results.length; i++) {
        const res = ev.results[i] as ArrayLike<{ transcript: string }> & { isFinal?: boolean };
        const txt = res[0].transcript;
        if (res.isFinal) finalText += txt;
        else interim += txt;
      }
      setMicPreview((prev) => (finalText ? prev + finalText : interim || prev));
    };
    r.onerror = () => setRecording(false);
    r.onend = () => setRecording(false);
    recogRef.current = r;
    setRecording(true);
    setMicPreview("");
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

  // ===== Core: send a user message =====
  const callApi = async (
    body: Record<string, unknown>,
  ): Promise<{
    reply?: string;
    structured?: {
      japanese: string;
      romaji: string | null;
      translation: string | null;
      options: McqOption[] | null;
      correct_index: number;
    };
    error?: string;
  }> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch("/api/interview", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || "AI_UNAVAILABLE");
    }
    return res.json();
  };

  const send = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || loading) return;
    setError(null);
    const userMsg: UserMsg = { id: crypto.randomUUID(), role: "user", content: text };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setMicPreview("");
    setLoading(true);
    gtagEvent("interview_message", { scenario: scenario.id });

    try {
      const j = await callApi({
        scenarioId: scenario.id,
        mode: "chat",
        lang,
        langMode,
        answerMode,
        messages: next.map((m) =>
          m.role === "user"
            ? { role: "user", content: m.content }
            : { role: "assistant", content: m.japanese },
        ),
      });
      const s = j.structured;
      if (!s) throw new Error("INVALID_RESPONSE");
      const aiMsg: AssistantMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        japanese: s.japanese,
        romaji: s.romaji,
        translation: s.translation,
        options: s.options,
        correctIndex: s.correct_index ?? 0,
        displayMode: langMode,
      };
      setMessages((m) => [...m, aiMsg]);
      setTimeout(() => speak(aiMsg.japanese, aiMsg.id), 150);
    } catch (e) {
      const code = (e as Error)?.message || "AI_UNAVAILABLE";
      setError(friendlyError(code, isId));
    } finally {
      setLoading(false);
    }
  };

  // Generate MCQ options for an existing assistant message that lacks them.
  const fetchOptionsFor = async (msgId: string) => {
    const msg = messages.find((m) => m.role === "assistant" && m.id === msgId) as
      | AssistantMsg
      | undefined;
    if (!msg || msg.options || openerOptionsLoading) return;
    setOpenerOptionsLoading(true);
    try {
      const j = await callApi({
        scenarioId: scenario.id,
        mode: "options_only",
        lang,
        langMode,
        answerMode: "mcq",
        messages: [],
        questionJp: msg.japanese,
      });
      const s = j.structured;
      if (!s) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.role === "assistant" && m.id === msgId
            ? { ...m, options: s.options ?? null, correctIndex: s.correct_index ?? 0 }
            : m,
        ),
      );
    } catch (e) {
      setError(friendlyError((e as Error)?.message || "AI_UNAVAILABLE", isId));
    } finally {
      setOpenerOptionsLoading(false);
    }
  };

  // When user enters chat in MCQ mode and the latest assistant lacks options, auto-fetch.
  const latestAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant") return m;
    }
    return null;
  }, [messages]);
  useEffect(() => {
    if (phase !== "chat") return;
    if (answerMode !== "mcq") return;
    if (!latestAssistant) return;
    if (latestAssistant.options && latestAssistant.options.length > 0) return;
    if (latestAssistant.pickedIndex !== undefined) return;
    fetchOptionsFor(latestAssistant.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, answerMode, latestAssistant?.id]);

  const pickOption = (msgId: string, idx: number) => {
    const msg = messages.find((m) => m.role === "assistant" && m.id === msgId) as
      | AssistantMsg
      | undefined;
    if (!msg || !msg.options) return;
    const chosen = msg.options[idx];
    if (!chosen) return;
    // Snapshot the picked index for inline feedback.
    setMessages((prev) =>
      prev.map((m) =>
        m.role === "assistant" && m.id === msgId ? { ...m, pickedIndex: idx } : m,
      ),
    );
    // Send the chosen Japanese text as the user reply, after a short delay so the user sees feedback.
    setTimeout(() => send(chosen.text), 900);
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
      const j = await callApi({
        scenarioId: scenario.id,
        mode: "feedback",
        lang,
        messages: messages.map((m) =>
          m.role === "user"
            ? { role: "user", content: m.content }
            : { role: "assistant", content: m.japanese },
        ),
      });
      const evalObj = (j as unknown as { evaluation: Evaluation }).evaluation;
      setEvaluation(evalObj);
      gtagEvent("interview_feedback", { scenario: scenario.id });
      gtagEvent("interview_completed", {
        scenario: scenario.id,
        avg_score: String(
          Math.round(
            ((evalObj?.grammar_score ?? 0) +
              (evalObj?.naturalness_score ?? 0) +
              (evalObj?.confidence_score ?? 0)) /
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

  // ===== SETUP screen =====
  if (phase === "setup") {
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

          {/* Lang mode */}
          <div className="mb-5">
            <p className="text-[11px] uppercase font-bold tracking-wider text-violet-900/70 mb-2">
              {isId
                ? "Mode bahasa (cara pertanyaan ditampilkan)"
                : "Language mode (how the question is shown)"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <ModeChip
                active={langMode === "translate"}
                onClick={() => setLangMode("translate")}
                title={isId ? "Terjemahan" : "Translation"}
                sub={isId ? "JP + arti" : "JP + meaning"}
              />
              <ModeChip
                active={langMode === "romaji"}
                onClick={() => setLangMode("romaji")}
                title="Romaji"
                sub={isId ? "JP + romaji" : "JP + romaji"}
              />
              <ModeChip
                active={langMode === "fullJp"}
                onClick={() => setLangMode("fullJp")}
                title={isId ? "Full Jepang" : "Full Japanese"}
                sub={isId ? "Tanpa bantuan" : "No assist"}
              />
            </div>
          </div>

          {/* Answer mode */}
          <div className="mb-6">
            <p className="text-[11px] uppercase font-bold tracking-wider text-violet-900/70 mb-2">
              {isId
                ? "Mode jawaban (cara kamu menjawab)"
                : "Answer mode (how you'll reply)"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <ModeChip
                active={answerMode === "mcq"}
                onClick={() => setAnswerMode("mcq")}
                title={isId ? "Pilihan ganda" : "Multiple choice"}
                sub={isId ? "4 opsi AI" : "4 AI options"}
                icon={<ListChecks className="w-3.5 h-3.5" />}
              />
              <ModeChip
                active={answerMode === "mic"}
                onClick={() => setAnswerMode("mic")}
                title="Microphone"
                sub={isId ? "Rekam suara" : "Voice"}
                icon={<Mic className="w-3.5 h-3.5" />}
              />
              <ModeChip
                active={answerMode === "type"}
                onClick={() => setAnswerMode("type")}
                title={isId ? "Ketik" : "Type"}
                sub={isId ? "Romaji/JP" : "Romaji/JP"}
                icon={<TypeIcon className="w-3.5 h-3.5" />}
              />
            </div>
          </div>

          <div className="mb-5">
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
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 px-5 py-3 text-sm font-bold text-white transition"
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

  // ===== CHAT screen =====
  return (
    <div className="mx-auto max-w-2xl px-4 py-4 sm:py-6 flex flex-col h-[calc(100vh-6rem)]">
      <header className="flex items-center gap-3 pb-2 border-b border-border">
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
            Demo {userTurnCount}/3
          </span>
        )}
      </header>

      {/* Mode toolbar — thin, max 36px */}
      <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/60 text-[11px] overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <Languages className="w-3 h-3 text-violet-600 shrink-0" />
          <ToolbarChip
            active={langMode === "translate"}
            onClick={() => setLangMode("translate")}
            label={isId ? "Terjemahan" : "Translate"}
          />
          <ToolbarChip
            active={langMode === "romaji"}
            onClick={() => setLangMode("romaji")}
            label="Romaji"
          />
          <ToolbarChip
            active={langMode === "fullJp"}
            onClick={() => setLangMode("fullJp")}
            label="Full JP"
          />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <ToolbarChip
            active={answerMode === "mcq"}
            onClick={() => setAnswerMode("mcq")}
            label={isId ? "Pilihan" : "Choices"}
            icon={<ListChecks className="w-3 h-3" />}
          />
          <ToolbarChip
            active={answerMode === "mic"}
            onClick={() => setAnswerMode("mic")}
            label="Mic"
            icon={<Mic className="w-3 h-3" />}
          />
          <ToolbarChip
            active={answerMode === "type"}
            onClick={() => setAnswerMode("type")}
            label={isId ? "Ketik" : "Type"}
            icon={<TypeIcon className="w-3 h-3" />}
          />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} text={m.content} />
          ) : (
            <AssistantBubble
              key={m.id}
              msg={m}
              scenarioEmoji={scenario.emoji}
              speaking={speaking}
              onSpeak={(text) => speak(text, m.id)}
              isId={isId}
            />
          ),
        )}
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
          </div>
        )}

        {evaluation && (
          <div className="mt-6 rounded-2xl border-2 border-violet-300 bg-violet-50 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-violet-900">
                {isId ? "Hasil Evaluasi" : "Evaluation Result"}
              </h3>
              {evaluation.vocabulary_level && (
                <span className="ml-auto rounded-full bg-violet-600 text-white px-2 py-0.5 text-[10px] font-bold">
                  {evaluation.vocabulary_level}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <ScoreBox label="Grammar" score={evaluation.grammar_score} />
              <ScoreBox label="Natural" score={evaluation.naturalness_score} />
              <ScoreBox label="Confidence" score={evaluation.confidence_score} />
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
                      <CheckCircle2 className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
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
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border pt-3 pb-2 space-y-3">
        {guestLimitReached && !evaluation ? (
          <div className="rounded-2xl bg-violet-100 border border-violet-300 p-4 text-center">
            <Lock className="w-5 h-5 mx-auto text-violet-700 mb-1" />
            <p className="text-sm font-bold text-violet-900">
              {isId
                ? "Daftar gratis untuk lanjutkan & simpan progresmu"
                : "Sign up free to continue & save your progress"}
            </p>
            <Link
              to="/auth"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-lime-500 hover:bg-lime-400 px-4 py-2 text-sm font-bold text-violet-900 transition"
            >
              {isId ? "Daftar gratis" : "Sign up free"} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : evaluation ? null : (
          <>
            {answerMode === "mcq" && (
              <McqAnswerArea
                msg={latestAssistant}
                loading={loading || openerOptionsLoading}
                onPick={(idx) => latestAssistant && pickOption(latestAssistant.id, idx)}
                isId={isId}
              />
            )}

            {answerMode === "mic" && (
              <MicAnswerArea
                recording={recording}
                preview={micPreview}
                onStart={startRecording}
                onStop={stopRecording}
                onSend={() => send(micPreview)}
                onReset={() => {
                  setMicPreview("");
                }}
                disabled={loading}
                isId={isId}
              />
            )}

            {answerMode === "type" && (
              <TypeAnswerArea
                value={input}
                onChange={setInput}
                onSend={() => send(input)}
                disabled={loading}
                isId={isId}
              />
            )}

            {user && (
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

// ===== Subcomponents =====

function ModeChip({
  active,
  onClick,
  title,
  sub,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-xl border-2 px-3 py-2.5 text-left transition",
        active
          ? "border-violet-600 bg-violet-600 text-white"
          : "border-violet-200 bg-white text-violet-900 hover:border-violet-400",
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-bold">
        {icon}
        {title}
      </span>
      <span className={cn("text-[10px]", active ? "text-violet-100" : "text-violet-900/60")}>
        {sub}
      </span>
    </button>
  );
}

function ToolbarChip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition border whitespace-nowrap",
        active
          ? "bg-violet-600 text-white border-violet-600"
          : "bg-white text-violet-800 border-violet-200 hover:border-violet-400",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-2 justify-end">
      <div
        className="max-w-[78%] rounded-2xl rounded-br-sm bg-violet-600 text-white px-3.5 py-2.5 text-sm"
        style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function AssistantBubble({
  msg,
  scenarioEmoji,
  speaking,
  onSpeak,
  isId,
}: {
  msg: AssistantMsg;
  scenarioEmoji: string;
  speaking: string | null;
  onSpeak: (text: string) => void;
  isId: boolean;
}) {
  const showRomaji = msg.displayMode === "romaji" && msg.romaji;
  const showTranslation = msg.displayMode === "translate" && msg.translation;
  return (
    <div className="flex gap-2 justify-start">
      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm flex-shrink-0">
        {scenarioEmoji}
      </div>
      <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-card border border-border px-3.5 py-2.5 text-sm">
        <p
          className="whitespace-pre-wrap leading-relaxed text-foreground"
          style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
        >
          {msg.japanese}
        </p>
        {showRomaji && (
          <p className="mt-1 text-xs italic text-muted-foreground">{msg.romaji}</p>
        )}
        {showTranslation && (
          <p className="mt-1 text-xs text-violet-700/80">{msg.translation}</p>
        )}
        <button
          onClick={() => onSpeak(msg.japanese)}
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition",
            speaking === msg.id && "text-violet-700",
          )}
        >
          <Volume2 className="w-3 h-3" />
          {speaking === msg.id
            ? isId
              ? "berbicara…"
              : "speaking…"
            : isId
              ? "dengar"
              : "play"}
        </button>

        {/* Inline MCQ feedback once user has picked */}
        {msg.pickedIndex !== undefined && msg.options && (
          <McqFeedback
            picked={msg.pickedIndex}
            correct={msg.correctIndex ?? 0}
            options={msg.options}
            isId={isId}
          />
        )}
      </div>
    </div>
  );
}

function McqFeedback({
  picked,
  correct,
  options,
  isId,
}: {
  picked: number;
  correct: number;
  options: McqOption[];
  isId: boolean;
}) {
  const ok = picked === correct;
  const chosen = options[picked];
  const best = options[correct];
  return (
    <div
      className={cn(
        "mt-2 rounded-lg border p-2 text-[11px]",
        ok ? "border-lime-400 bg-lime-50 text-violet-900" : "border-amber-300 bg-amber-50 text-amber-900",
      )}
    >
      <div className="inline-flex items-center gap-1 font-bold">
        {ok ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" /> {isId ? "Tepat!" : "Nice!"}
          </>
        ) : (
          <>
            <XCircle className="w-3.5 h-3.5" /> {isId ? "Kurang tepat" : "Not quite"}
          </>
        )}
      </div>
      {chosen?.feedback && <p className="mt-1 leading-snug">{chosen.feedback}</p>}
      {!ok && best && (
        <p className="mt-1 leading-snug">
          <span className="font-semibold">{isId ? "Lebih natural:" : "More natural:"}</span>{" "}
          <span style={{ fontFamily: '"Noto Sans JP", sans-serif' }}>{best.text}</span>
        </p>
      )}
    </div>
  );
}

function McqAnswerArea({
  msg,
  loading,
  onPick,
  isId,
}: {
  msg: AssistantMsg | null;
  loading: boolean;
  onPick: (idx: number) => void;
  isId: boolean;
}) {
  if (!msg) return null;
  if (!msg.options) {
    return (
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900 text-center">
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {isId ? "Menyiapkan pilihan jawaban…" : "Generating answer options…"}
          </span>
        ) : (
          isId ? "Pilihan jawaban tidak tersedia." : "Answer options unavailable."
        )}
      </div>
    );
  }
  const picked = msg.pickedIndex;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {msg.options.map((opt, i) => {
        const isPicked = picked === i;
        const isCorrect = (msg.correctIndex ?? 0) === i;
        return (
          <button
            key={i}
            type="button"
            disabled={picked !== undefined || loading}
            onClick={() => onPick(i)}
            className={cn(
              "rounded-xl border-2 px-3 py-2.5 text-left text-sm transition disabled:opacity-90",
              picked === undefined
                ? "border-violet-200 bg-white hover:border-violet-500 hover:bg-violet-50"
                : isPicked && isCorrect
                  ? "border-lime-500 bg-lime-100"
                  : isPicked
                    ? "border-amber-400 bg-amber-50"
                    : isCorrect
                      ? "border-lime-400 bg-lime-50"
                      : "border-violet-100 bg-white opacity-70",
            )}
          >
            <span
              className="text-violet-900 font-medium"
              style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
            >
              {opt.text}
            </span>
            {opt.romaji && (
              <span className="block text-[10px] italic text-muted-foreground mt-0.5">
                {opt.romaji}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MicAnswerArea({
  recording,
  preview,
  onStart,
  onStop,
  onSend,
  onReset,
  disabled,
  isId,
}: {
  recording: boolean;
  preview: string;
  onStart: () => void;
  onStop: () => void;
  onSend: () => void;
  onReset: () => void;
  disabled: boolean;
  isId: boolean;
}) {
  return (
    <div className="space-y-2">
      {preview && (
        <div className="rounded-xl border border-violet-200 bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider font-bold text-violet-700/70 mb-1">
            {isId ? "Hasil transkripsi" : "Transcription"}
          </p>
          <p
            className="text-sm text-violet-900"
            style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
          >
            {preview}
          </p>
        </div>
      )}
      <div className="flex items-center justify-center gap-3">
        {!preview || recording ? (
          <button
            type="button"
            onClick={recording ? onStop : onStart}
            disabled={disabled}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition shadow-sm",
              recording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-violet-600 hover:bg-violet-700 text-white",
            )}
          >
            {recording ? (
              <>
                <MicOff className="w-5 h-5" />
                {isId ? "Berhenti merekam" : "Stop"}
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                {isId ? "Mulai rekam" : "Record"}
              </>
            )}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onReset}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-full border border-violet-300 bg-white text-violet-700 px-4 py-2.5 text-sm font-bold hover:bg-violet-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              {isId ? "Rekam ulang" : "Re-record"}
            </button>
            <button
              type="button"
              onClick={onSend}
              disabled={disabled || !preview.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-lime-500 hover:bg-lime-400 text-violet-900 px-5 py-2.5 text-sm font-bold transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isId ? "Kirim" : "Send"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function TypeAnswerArea({
  value,
  onChange,
  onSend,
  disabled,
  isId,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  isId: boolean;
}) {
  // Detect pure-ASCII (romaji) and show wanakana hiragana preview.
  const isRomajiOnly = value.trim().length > 0 && /^[\x20-\x7E]+$/.test(value);
  const preview = isRomajiOnly ? wanakana.toHiragana(value) : "";

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={
            isId ? "Ketik dalam romaji atau Jepang…" : "Type in romaji or Japanese…"
          }
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300 max-h-32"
          style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="p-3 rounded-full bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition flex-shrink-0"
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      {preview && (
        <p
          className="text-[11px] text-violet-700/80 pl-2"
          style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
        >
          <span className="text-muted-foreground">
            {isId ? "Preview hiragana: " : "Hiragana preview: "}
          </span>
          {preview}
        </p>
      )}
    </div>
  );
}

function ScoreBox({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80 ? "text-lime-600" : score >= 60 ? "text-violet-600" : "text-amber-600";
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
