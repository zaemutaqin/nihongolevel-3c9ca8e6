import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type InterviewSessionSummary = {
  id: string;
  scenario_id: string;
  scenario_title: string;
  completed: boolean;
  grammar_score: number | null;
  naturalness_score: number | null;
  confidence_score: number | null;
  vocabulary_level: string | null;
  summary: string | null;
  created_at: string;
};

export const getMyInterviewSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("interview_sessions")
      .select(
        "id, scenario_id, scenario_title, completed, grammar_score, naturalness_score, confidence_score, vocabulary_level, summary, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (data ?? []) as InterviewSessionSummary[];
  });
