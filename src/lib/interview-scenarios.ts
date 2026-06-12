// Interview Simulator scenarios — MVP starter set (2 scenarios).
// Designed to be extensible: add more entries to SCENARIOS and they show up
// automatically on the picker page.

export type InterviewScenario = {
  id: string;
  emoji: string;
  free: boolean;
  title_id: string;
  title_en: string;
  description_id: string;
  description_en: string;
  role_id: string;
  role_en: string;
  // Difficulty hint shown on the card
  level: "N5" | "N4" | "N3";
  // The first AI line (the interviewer opens the conversation)
  ai_opening_japanese: string;
  ai_opening_romaji: string;
  // System prompt for the AI (English, sent to the model)
  persona: string;
};

export const INTERVIEW_SCENARIOS: InterviewScenario[] = [
  {
    id: "iv_tokutei_ginou",
    emoji: "🏭",
    free: true,
    title_id: "Interview Tokutei Ginou",
    title_en: "Tokutei Ginou Interview",
    description_id:
      "Latihan interview untuk program Tokutei Ginou (Specified Skilled Worker). Kamu akan ditanya tentang motivasi, pengalaman, dan kesiapan kerja di Jepang.",
    description_en:
      "Practice the Tokutei Ginou (Specified Skilled Worker) interview. The interviewer asks about your motivation, experience, and readiness to work in Japan.",
    role_id: "Pewawancara perusahaan Jepang",
    role_en: "Japanese company interviewer",
    level: "N4",
    ai_opening_japanese:
      "本日は面接にお越しいただきありがとうございます。それでは、まず自己紹介をお願いいたします。",
    ai_opening_romaji:
      "Honjitsu wa mensetsu ni okoshi itadaki arigatou gozaimasu. Sore dewa, mazu jiko-shoukai wo onegai itashimasu.",
    persona:
      "You are a Japanese HR interviewer screening a candidate for the Tokutei Ginou (SSW) program. Use polite business Japanese (です/ます + light keigo). Ask one question at a time, in this rough order: self-introduction, motivation for coming to Japan, work experience, why this industry, Japanese study experience, ability to live alone in Japan, and questions for the interviewer. Keep each reply to 1-3 short Japanese sentences. Stay strictly in character — never translate, never break the fourth wall. If the user replies in Indonesian/English or with romaji, gently nudge them in Japanese to try again in Japanese (e.g. 「日本語でお願いします」). After roughly 6-8 user turns, wrap up with 「本日は以上です。お疲れさまでした。」",
  },
  {
    id: "iv_restaurant_staff",
    emoji: "🍱",
    free: true,
    title_id: "Interview Staff Restoran",
    title_en: "Restaurant Staff Interview",
    description_id:
      "Latihan interview untuk posisi staff restoran (waiter / kitchen). Akan ditanya soal pengalaman customer service, shift, dan bahasa Jepang dasar.",
    description_en:
      "Practice an interview for a restaurant staff role (waiter / kitchen). Expect questions about customer service experience, shifts, and basic Japanese.",
    role_id: "Manajer restoran",
    role_en: "Restaurant manager",
    level: "N5",
    ai_opening_japanese:
      "いらっしゃいませ。今日は面接に来ていただきありがとうございます。簡単に自己紹介をお願いします。",
    ai_opening_romaji:
      "Irasshaimase. Kyou wa mensetsu ni kite itadaki arigatou gozaimasu. Kantan ni jiko-shoukai wo onegai shimasu.",
    persona:
      "You are a friendly Japanese restaurant manager interviewing a candidate for a part-time restaurant staff role. Use standard polite Japanese (です/ます). Ask one question at a time: self-introduction, why this restaurant, prior food service experience, availability (days/hours), Japanese level, and how they would handle a difficult customer. Keep replies short (1-2 Japanese sentences). Stay in character — never translate to English/Indonesian. If the user replies in non-Japanese, gently ask in Japanese to please answer in Japanese. After roughly 6-8 user turns, close with 「ありがとうございました。結果は後ほどご連絡します。」",
  },
];

export function getInterviewScenario(id: string): InterviewScenario | undefined {
  return INTERVIEW_SCENARIOS.find((s) => s.id === id);
}
