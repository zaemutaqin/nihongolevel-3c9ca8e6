import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Mic, MicOff, Send, Volume2, Sparkles, Loader2,
  AlertCircle, Trophy, CheckCircle2, ChevronRight, Lock, Languages,
  Type as TypeIcon, ListChecks, RefreshCw, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as wanakana from "wanakana";
import { getInterviewScenario, getScenarioHints, type ScenarioHint } from "@/lib/interview-scenarios";
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
  role: "assistant"; id: string; japanese: string; romaji?: string | null;
  translation?: string | null; options?: McqOption[] | null; correctIndex?: number;
  displayMode: LangMode; pickedIndex?: number;
};
type UserMsg = { role: "user"; id: string; content: string };
type Msg = AssistantMsg | UserMsg;

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

  // ===== Direct Fetch ke Gemini (Ganti Backend) =====
  const callApi = async (body: any) => {
    // Membaca API Key (prioritaskan VITE, fallback ke proses.env)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AUTH_REQUIRED");

    const prompt = `Anda adalah pewawancara kerja bahasa Jepang.
      Scenario: ${scenario?.title_en}. 
      History: ${JSON.stringify(body.messages)}.
      Berikan respons JSON murni (TANPA MARKDOWN):
      {
        "japanese": "...",
        "romaji": "...",
        "translation": "...",
        "options": [{"text": "...", "feedback": "..."}],
        "correct_index": 0
      }`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    if (!res.ok) throw new Error("AI_UNAVAILABLE");
    
    const data = await res.json();
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return { structured: JSON.parse(text) };
  };

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [langMode, setLangMode] = useState<LangMode>("translate");
  const [error, setError] = useState<string | null>(null);

  const send = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || loading) return;
    const userMsg: UserMsg = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const j = await callApi({ messages: next });
      const s = j.structured;
      const aiMsg: AssistantMsg = {
        id: crypto.randomUUID(), role: "assistant", japanese: s.japanese,
        romaji: s.romaji, translation: s.translation, options: s.options,
        correctIndex: s.correct_index ?? 0, displayMode: langMode,
      };
      setMessages((m) => [...m, aiMsg]);
      speakJapanese(aiMsg.japanese, {});
    } catch {
      setError("AI tidak tersedia.");
    } finally {
      setLoading(false);
    }
  };

  if (!scenario) return null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{isId ? scenario.title_id : scenario.title_en}</h1>
      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className={cn("p-4 rounded-xl", m.role === "user" ? "bg-violet-600 text-white" : "bg-gray-100")}>
              {m.role === "assistant" ? m.japanese : m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          className="border p-2 flex-1 rounded-xl"
        />
        <button onClick={() => send(input)} className="bg-violet-600 text-white px-6 py-2 rounded-xl">
          {loading ? <Loader2 className="animate-spin" /> : "Kirim"}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
