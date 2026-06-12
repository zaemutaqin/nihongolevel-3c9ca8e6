// Skenario roleplay untuk Hanashite Room (AI Speaking Simulator).
// `free: true` artinya bisa diakses semua user yang sudah login (1 skenario teaser).
// Sisanya hanya untuk Pro.

export type Scenario = {
  id: string;
  emoji: string;
  free: boolean;
  // Indonesian copy
  title_id: string;
  situation_id: string;
  role_id: string;
  tone_id: string;
  opening_id: string; // initial AI line shown as hint (Indonesian explanation)
  // English copy
  title_en: string;
  situation_en: string;
  role_en: string;
  tone_en: string;
  opening_en: string;
  // What the AI says first (in Japanese)
  ai_first_japanese: string;
  ai_first_romaji: string;
  // System prompt fragment describing the AI persona
  persona: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "sc_ramen",
    emoji: "🍜",
    free: true,
    title_id: "Pesan Ramen di Ichiraku",
    situation_id: "Kamu masuk ke kedai ramen kecil di Tokyo. Pelayan menyambutmu.",
    role_id: "Pelayan toko ramen",
    tone_id: "Sopan standar (です/ます)",
    opening_id: "Pelayan akan menyapa. Pesan ramen dan minuman sesukamu.",
    title_en: "Order Ramen at Ichiraku",
    situation_en: "You enter a small ramen shop in Tokyo. The waiter greets you.",
    role_en: "Ramen shop waiter",
    tone_en: "Standard polite (desu/masu)",
    opening_en: "The waiter will greet you. Order ramen and a drink.",
    ai_first_japanese: "いらっしゃいませ！何名様ですか？",
    ai_first_romaji: "Irasshaimase! Nan-mei-sama desu ka?",
    persona:
      "You are a friendly waiter at a small ramen shop in Tokyo. Use standard polite Japanese (desu/masu form). Keep replies short (1-2 sentences). Stay in character. Offer menu items (tonkotsu, shoyu, miso, shio ramen, gyoza, beer, ocha) naturally. End the conversation politely when the order is complete.",
  },
  {
    id: "sc_meeting",
    emoji: "💼",
    free: false,
    title_id: "Meeting Pagi di Kantor",
    situation_id: "Atasanmu (shachou) memintamu melaporkan progres proyek pagi ini.",
    role_id: "Atasan (Shachou)",
    tone_id: "Keigo / Sonkeigo",
    opening_id: "Atasanmu menyapa. Berikan laporan singkat dengan keigo.",
    title_en: "Morning Meeting at the Office",
    situation_en: "Your boss (shachou) asks for your project progress this morning.",
    role_en: "Boss (Shachou)",
    tone_en: "Keigo / Sonkeigo",
    opening_en: "Your boss greets you. Give a brief report using keigo.",
    ai_first_japanese: "おはようございます。今週のプロジェクトの進捗を教えてください。",
    ai_first_romaji: "Ohayou gozaimasu. Konshuu no purojekuto no shinchoku wo oshiete kudasai.",
    persona:
      "You are a strict but fair Japanese company president (shachou) in a morning meeting. Use sonkeigo/keigo. Expect the user to use kenjougo (humble form) when referring to themselves. Ask follow-up questions about deadlines, blockers, and next steps. Keep replies concise (1-2 sentences). If the user uses casual form, gently correct them in-character.",
  },
  {
    id: "sc_shibuya",
    emoji: "🗺️",
    free: false,
    title_id: "Tersesat di Shibuya",
    situation_id: "Kamu tersesat di sekitar stasiun Shibuya dan bertanya pada orang asing.",
    role_id: "Orang asing yang ramah",
    tone_id: "Sopan standar",
    opening_id: "Orang itu akan menyapa. Tanyakan arah ke Hachiko atau tujuan lain.",
    title_en: "Lost in Shibuya",
    situation_en: "You are lost near Shibuya station and ask a stranger for help.",
    role_en: "Friendly local stranger",
    tone_en: "Standard polite",
    opening_en: "The stranger greets you. Ask for directions to Hachiko or another spot.",
    ai_first_japanese: "あ、どうしましたか？道に迷われましたか？",
    ai_first_romaji: "A, doushimashita ka? Michi ni mayowaremashita ka?",
    persona:
      "You are a kind Tokyo local near Shibuya station helping a tourist. Use standard polite Japanese. Give clear directions referencing real Shibuya landmarks (Hachiko statue, Shibuya Scramble, 109 building, Center-gai, JR line). Keep replies short (1-3 sentences). Be patient and encouraging.",
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
