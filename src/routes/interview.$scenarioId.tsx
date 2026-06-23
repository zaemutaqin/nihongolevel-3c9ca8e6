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
  displayMode: LangMode;
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
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

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
  component: InterviewPlay,
});

function InterviewPlay() {
  const { scenarioId } = Route.useParams();
  const scenario = getInterviewScenario(scenarioId);
  const { lang } = useT();
  const { user } = useAuth();
  const isId = lang === "id";
  const navigate = useNavigate();

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

  const [langMode, setLangModeRaw] = useState<LangMode>("translate");
  const [answerMode, setAnswerModeRaw] = useState<AnswerMode>("type");
  useEffect(() => {
    const lmPref = loadLangModePref();
    setLangModeRaw(lmPref ?? defaultLangModeForLevel(currentLevelOrder));
    const amPref = loadAnswerModePref();
    if (amPref) setAnswerModeRaw(amPref);
  }, [currentLevelOrder]);

  const setLangMode = (m: LangMode) => { setLangModeRaw(m); window.localStorage.setItem(LS_LANG_MODE, m); };
  const setAnswerMode = (m: AnswerMode) => { setAnswerModeRaw(m); window.localStorage.setItem(LS_ANSWER_MODE, m); };

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [phase, setPhase] = useState<"setup" | "chat">("setup");
  const [openerOptionsLoading, setOpenerOptionsLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [micPreview, setMicPreview] = useState<string>("");
  const recogRef = useRef<SR | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const hints: ScenarioHint[] = scenario ? getScenarioHints(scenario.id) : [];
  const isGuestDemo = !user && scenario?.id === "iv_kaigo";
  const userTurnCount = messages.filter((m) => m.role === "user").length;
  const guestLimitReached = isGuestDemo && userTurnCount >= 3;

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
  }, [scenario?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, evaluation]);

  if (!scenario) return null;

  // ===== Direct Frontend Fetch Logic =====
  const callApi = async (body: any) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("AUTH_REQUIRED");

    const prompt = `
      You are a Japanese interview coach. Scenario: ${scenario.title_en}. 
      History: ${JSON.stringify(body.messages)}. 
      User just said: ${body.questionJp || body.messages?.[body.messages.length-1]?.content || ""}.
      Output JSON strictly format (no markdown):
      {
        "japanese": "...",
        "romaji": "...",
        "translation": "...",
        "options": [{"text": "...", "feedback": "..."}],
        "correct_index": 0
      }
    `;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    if (!res.ok) throw new Error("AI_UNAVAILABLE");
    
    const data = await res.json();
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, "").replace(/```/g, "");
    return { structured: JSON.parse(text) };
  };

  const send = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || loading) return;
    const userMsg: UserMsg = { id: crypto.randomUUID(), role: "user", content: text };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const j = await callApi({ messages: next });
      const s = j.structured;
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
      speak(aiMsg.japanese, aiMsg.id);
    } catch {
      setError("AI tidak tersedia. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string, id: string) => {
    speakJapanese(text, {
      rate: 0.95,
      onStart: () => setSpeaking(id),
      onEnd: () => setSpeaking(null),
    });
  };

  // Sisanya biarkan sama seperti kode aslimu untuk bagian UI/Render...
  // (Karena ruang terbatas, pastikan kamu mengganti fungsi `callApi` dan `send` saja)
  
  // Return UI/JSX kamu seperti biasa di sini...
  return (<div>{/* ... UI kamu ... */}</div>);
}
