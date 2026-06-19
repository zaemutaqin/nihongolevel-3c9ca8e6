// Interview Simulator scenarios — full SSW (Tokutei Ginou) + Gijinkoku + Ryuugakusei coverage.

export type ScenarioCategory =
  | "service"
  | "manufacturing"
  | "infrastructure"
  | "primary"
  | "professional";

export type InterviewScenario = {
  id: string;
  emoji: string;
  free: boolean;
  category: ScenarioCategory;
  title_id: string;
  title_en: string;
  description_id: string;
  description_en: string;
  role_id: string;
  role_en: string;
  level: "N5" | "N4" | "N3";
  ai_opening_japanese: string;
  ai_opening_romaji: string;
  persona: string;
};

const baseFormal = (industryEn: string) =>
  `You are a Japanese HR interviewer screening a candidate for a ${industryEn} role under the Tokutei Ginou (SSW) program. Use polite business Japanese (です/ます + light keigo). Ask one question at a time: self-introduction, motivation, prior experience, why this industry, Japanese study, ability to live in Japan, questions for the interviewer. Keep replies to 1-3 short Japanese sentences. Stay strictly in character — never translate, never break the fourth wall. If the user replies in Indonesian/English or romaji, gently nudge them with 「日本語でお願いします」. After 6-8 user turns, close with 「本日は以上です。お疲れさまでした。」`;

const baseManager = (industryEn: string) =>
  `You are a friendly Japanese site manager interviewing a candidate for a ${industryEn} position. Use standard polite Japanese (です/ます). Ask one question at a time: self-introduction, why this industry, prior experience, availability, Japanese level, and how they would handle a difficult on-the-job situation. Keep replies short (1-2 sentences). Stay in character. If the user replies in non-Japanese, ask in Japanese to please answer in Japanese. After 6-8 turns, close with 「ありがとうございました。結果は後ほどご連絡します。」`;

const OPEN_FORMAL = {
  jp: "本日は面接にお越しいただきありがとうございます。それでは、まず自己紹介をお願いいたします。",
  ro: "Honjitsu wa mensetsu ni okoshi itadaki arigatou gozaimasu. Sore dewa, mazu jiko-shoukai wo onegai itashimasu.",
};
const OPEN_CASUAL = {
  jp: "今日は面接に来ていただきありがとうございます。簡単に自己紹介をお願いします。",
  ro: "Kyou wa mensetsu ni kite itadaki arigatou gozaimasu. Kantan ni jiko-shoukai wo onegai shimasu.",
};

export const INTERVIEW_SCENARIOS: InterviewScenario[] = [
  // ===== A. Pelayanan & Hospitality =====
  {
    id: "iv_kaigo",
    emoji: "👵",
    free: true,
    category: "service",
    title_id: "Kaigo (Perawatan Lansia)",
    title_en: "Kaigo (Elderly Care)",
    description_id: "Wawancara untuk staff panti / perawat lansia. Fokus pada empati, fisik, dan shift malam.",
    description_en: "Interview for elderly-care staff. Focus on empathy, stamina, and night shifts.",
    role_id: "Manajer panti lansia",
    role_en: "Care facility manager",
    level: "N4",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("elderly care (介護)"),
  },
  {
    id: "iv_hotel",
    emoji: "🏨",
    free: true,
    category: "service",
    title_id: "Akomodasi / Perhotelan",
    title_en: "Hotel & Accommodation",
    description_id: "Wawancara front desk / housekeeping hotel. Fokus pada keigo dan pelayanan tamu.",
    description_en: "Hotel front desk / housekeeping interview. Focus on keigo and guest service.",
    role_id: "GM hotel",
    role_en: "Hotel manager",
    level: "N4",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("hotel & accommodation (宿泊)"),
  },
  {
    id: "iv_restaurant_staff",
    emoji: "🍱",
    free: true,
    category: "service",
    title_id: "Restoran & Jasa Boga",
    title_en: "Restaurant & Food Service",
    description_id: "Wawancara staff restoran (waiter / kitchen). Customer service, shift, bahasa dasar.",
    description_en: "Restaurant staff interview (waiter / kitchen). Service, shifts, basic Japanese.",
    role_id: "Manajer restoran",
    role_en: "Restaurant manager",
    level: "N5",
    ai_opening_japanese: OPEN_CASUAL.jp,
    ai_opening_romaji: OPEN_CASUAL.ro,
    persona: baseManager("restaurant / food service (外食業)"),
  },
  {
    id: "iv_building_cleaning",
    emoji: "🧹",
    free: false,
    category: "service",
    title_id: "Pembersihan Gedung",
    title_en: "Building Cleaning",
    description_id: "Wawancara staff cleaning gedung. Fokus ketelitian, jadwal pagi, dan keselamatan.",
    description_en: "Building cleaning interview. Detail-oriented work, early shifts, safety.",
    role_id: "Supervisor cleaning",
    role_en: "Cleaning supervisor",
    level: "N5",
    ai_opening_japanese: OPEN_CASUAL.jp,
    ai_opening_romaji: OPEN_CASUAL.ro,
    persona: baseManager("building cleaning (ビルクリーニング)"),
  },

  // ===== B. Manufaktur & Industri Berat =====
  {
    id: "iv_tokutei_ginou",
    emoji: "🏭",
    free: true,
    category: "manufacturing",
    title_id: "Tokutei Ginou (Umum)",
    title_en: "Tokutei Ginou (General)",
    description_id: "Wawancara umum program Tokutei Ginou — motivasi, pengalaman, kesiapan kerja.",
    description_en: "General Tokutei Ginou interview — motivation, experience, readiness.",
    role_id: "Pewawancara perusahaan Jepang",
    role_en: "Japanese company interviewer",
    level: "N4",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("the Tokutei Ginou (SSW) program (general)"),
  },
  {
    id: "iv_machine_parts",
    emoji: "⚙️",
    free: false,
    category: "manufacturing",
    title_id: "Suku Cadang Mesin",
    title_en: "Machine Parts Manufacturing",
    description_id: "Wawancara pabrik pembuatan suku cadang mesin. Presisi, gambar teknik, shift.",
    description_en: "Machine parts factory interview. Precision, technical drawings, shifts.",
    role_id: "Manajer produksi",
    role_en: "Production manager",
    level: "N4",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("machine parts manufacturing (素形材産業)"),
  },
  {
    id: "iv_industrial_machinery",
    emoji: "🛠️",
    free: false,
    category: "manufacturing",
    title_id: "Permesinan Pabrik",
    title_en: "Industrial Machinery",
    description_id: "Wawancara permesinan industri — perakitan, maintenance, dan keselamatan.",
    description_en: "Industrial machinery interview — assembly, maintenance, safety.",
    role_id: "Engineer senior",
    role_en: "Senior engineer",
    level: "N4",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("industrial machinery (産業機械)"),
  },
  {
    id: "iv_electronics",
    emoji: "🔌",
    free: false,
    category: "manufacturing",
    title_id: "Listrik, Elektronik & Informasi",
    title_en: "Electric, Electronics & Info",
    description_id: "Wawancara industri listrik/elektronik. Komponen, soldering, dan pemecahan masalah.",
    description_en: "Electrical/electronics interview. Components, soldering, troubleshooting.",
    role_id: "Manajer pabrik",
    role_en: "Plant manager",
    level: "N4",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("electric, electronics & information industries (電気・電子情報)"),
  },
  {
    id: "iv_construction",
    emoji: "🏗️",
    free: false,
    category: "manufacturing",
    title_id: "Konstruksi",
    title_en: "Construction",
    description_id: "Wawancara konstruksi — pengalaman lapangan, alat berat, keselamatan kerja.",
    description_en: "Construction interview — site experience, heavy equipment, safety.",
    role_id: "Mandor proyek",
    role_en: "Site foreman",
    level: "N4",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("construction (建設)"),
  },
  {
    id: "iv_shipbuilding",
    emoji: "🚢",
    free: false,
    category: "manufacturing",
    title_id: "Maritim & Perkapalan",
    title_en: "Shipbuilding & Maritime",
    description_id: "Wawancara galangan kapal — welding, perakitan baja, dan kerja tim.",
    description_en: "Shipyard interview — welding, steel assembly, teamwork.",
    role_id: "Manajer galangan",
    role_en: "Shipyard manager",
    level: "N4",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("shipbuilding & ship machinery (造船・舶用工業)"),
  },
  {
    id: "iv_food_manufacturing",
    emoji: "🥫",
    free: false,
    category: "manufacturing",
    title_id: "Makanan & Minuman Olahan",
    title_en: "Food & Beverage Manufacturing",
    description_id: "Wawancara pabrik makanan olahan — higienitas, line produksi, dan shift.",
    description_en: "Food manufacturing interview — hygiene, production line, shifts.",
    role_id: "QC supervisor",
    role_en: "QC supervisor",
    level: "N4",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("food & beverage manufacturing (飲食料品製造業)"),
  },

  // ===== C. Infrastruktur & Transportasi =====
  {
    id: "iv_automotive",
    emoji: "🔧",
    free: false,
    category: "infrastructure",
    title_id: "Perawatan & Perbaikan Otomotif",
    title_en: "Automotive Maintenance",
    description_id: "Wawancara bengkel otomotif — diagnosa, tools, dan pengalaman mekanik.",
    description_en: "Auto repair interview — diagnostics, tools, mechanic experience.",
    role_id: "Kepala bengkel",
    role_en: "Workshop manager",
    level: "N4",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("automotive maintenance & repair (自動車整備)"),
  },
  {
    id: "iv_aviation",
    emoji: "✈️",
    free: false,
    category: "infrastructure",
    title_id: "Penerbangan",
    title_en: "Aviation",
    description_id: "Wawancara ground handling / line maintenance — prosedur, bahasa radio, ketelitian.",
    description_en: "Ground handling / line maintenance — procedures, radio English, precision.",
    role_id: "Manajer ground ops",
    role_en: "Ground ops manager",
    level: "N3",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("aviation (航空)"),
  },
  {
    id: "iv_railway",
    emoji: "🚆",
    free: false,
    category: "infrastructure",
    title_id: "Perkeretaapian",
    title_en: "Railway",
    description_id: "Wawancara industri kereta — perawatan rel, sinyal, dan shift malam.",
    description_en: "Railway industry — track maintenance, signals, overnight shifts.",
    role_id: "Supervisor stasiun",
    role_en: "Station supervisor",
    level: "N3",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("railway industry (鉄道)"),
  },
  {
    id: "iv_public_transport",
    emoji: "🚌",
    free: false,
    category: "infrastructure",
    title_id: "Transportasi Publik (Bus/Taksi)",
    title_en: "Public Transport (Bus/Taxi)",
    description_id: "Wawancara pengemudi bus/taksi — SIM Jepang, navigasi, dan keramahan.",
    description_en: "Bus/taxi driver interview — Japanese license, navigation, hospitality.",
    role_id: "Manajer pool",
    role_en: "Fleet manager",
    level: "N3",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: baseFormal("public transport driving (自動車運送業)"),
  },

  // ===== D. Industri Primer =====
  {
    id: "iv_agriculture",
    emoji: "🌾",
    free: false,
    category: "primary",
    title_id: "Pertanian & Peternakan",
    title_en: "Agriculture & Livestock",
    description_id: "Wawancara pertanian — kerja outdoor, musim panen, dan tinggal di pedesaan.",
    description_en: "Agriculture interview — outdoor work, harvest season, rural life.",
    role_id: "Pemilik lahan",
    role_en: "Farm owner",
    level: "N5",
    ai_opening_japanese: OPEN_CASUAL.jp,
    ai_opening_romaji: OPEN_CASUAL.ro,
    persona: baseManager("agriculture (農業)"),
  },
  {
    id: "iv_fishery",
    emoji: "🐟",
    free: false,
    category: "primary",
    title_id: "Perikanan",
    title_en: "Fishery",
    description_id: "Wawancara perikanan — kerja kapal, cuaca, dan pengolahan hasil tangkap.",
    description_en: "Fishery interview — boat work, weather, seafood processing.",
    role_id: "Kapten kapal",
    role_en: "Boat captain",
    level: "N5",
    ai_opening_japanese: OPEN_CASUAL.jp,
    ai_opening_romaji: OPEN_CASUAL.ro,
    persona: baseManager("fishery & aquaculture (漁業)"),
  },
  {
    id: "iv_forestry",
    emoji: "🌲",
    free: false,
    category: "primary",
    title_id: "Kehutanan & Industri Kayu",
    title_en: "Forestry & Wood Industry",
    description_id: "Wawancara kehutanan — chainsaw, fisik prima, dan kerja tim di gunung.",
    description_en: "Forestry interview — chainsaw, fitness, mountain teamwork.",
    role_id: "Mandor hutan",
    role_en: "Forestry foreman",
    level: "N4",
    ai_opening_japanese: OPEN_CASUAL.jp,
    ai_opening_romaji: OPEN_CASUAL.ro,
    persona: baseManager("forestry & wood industry (林業)"),
  },

  // ===== E. Profesional & Akademis =====
  {
    id: "iv_gijinkoku",
    emoji: "💻",
    free: false,
    category: "professional",
    title_id: "Gijinkoku / IT Engineer",
    title_en: "Gijinkoku / IT Engineer",
    description_id: "Wawancara engineer (visa Gijinkoku) — proyek, stack, dan komunikasi tim Jepang.",
    description_en: "Engineer (Gijinkoku visa) interview — projects, stack, team communication.",
    role_id: "Engineering manager",
    role_en: "Engineering manager",
    level: "N3",
    ai_opening_japanese: OPEN_FORMAL.jp,
    ai_opening_romaji: OPEN_FORMAL.ro,
    persona: `You are a Japanese engineering manager interviewing a candidate for an IT engineering role under the Gijinkoku ("Engineer/Specialist in Humanities/International Services") visa. Use polite business Japanese (です/ます + light keigo). Ask one question at a time: self-introduction, recent projects, tech stack, problem-solving example, why work in Japan, and questions for the interviewer. Keep replies short (1-3 Japanese sentences). Stay strictly in character. Nudge non-Japanese answers with 「日本語でお願いします」. After 6-8 turns close with 「本日は以上です。お疲れさまでした。」`,
  },
  {
    id: "iv_ryuugakusei",
    emoji: "🎓",
    free: false,
    category: "professional",
    title_id: "Ryuugakusei / Kehidupan Pelajar",
    title_en: "Ryuugakusei / Student Life",
    description_id: "Wawancara penerimaan pelajar (留学生) — motivasi belajar, jurusan, dan rencana di Jepang.",
    description_en: "Student admission interview — motivation, major, plans in Japan.",
    role_id: "Pewawancara sekolah bahasa",
    role_en: "Language school interviewer",
    level: "N5",
    ai_opening_japanese:
      "本日は面接にお越しいただきありがとうございます。まず、自己紹介と日本へ来た理由を教えてください。",
    ai_opening_romaji:
      "Honjitsu wa mensetsu ni okoshi itadaki arigatou gozaimasu. Mazu, jiko-shoukai to Nihon e kita riyuu wo oshiete kudasai.",
    persona: `You are a Japanese language-school admissions interviewer screening a prospective international student (留学生). Use clear polite Japanese (です/ます) — speak a little slower since the candidate is a beginner. Ask one question at a time: self-introduction, why study Japanese, why this school, future plans (further study / work in Japan), how they will support themselves, and one question about daily life in Japan. Keep replies to 1-2 short sentences. Stay strictly in character. Gently nudge non-Japanese answers with 「日本語でお願いします」. After 6-8 turns close with 「ありがとうございました。結果は後ほどご連絡します。」`,
  },
];

export const SCENARIO_CATEGORIES: {
  id: ScenarioCategory;
  label_id: string;
  label_en: string;
  emoji: string;
}[] = [
  { id: "service", label_id: "Pelayanan", label_en: "Service", emoji: "🛎️" },
  { id: "manufacturing", label_id: "Manufaktur", label_en: "Manufacturing", emoji: "🏭" },
  { id: "infrastructure", label_id: "Infrastruktur", label_en: "Infrastructure", emoji: "🚆" },
  { id: "primary", label_id: "Alam", label_en: "Primary", emoji: "🌾" },
  { id: "professional", label_id: "Profesional", label_en: "Professional", emoji: "💻" },
];

export function getInterviewScenario(id: string): InterviewScenario | undefined {
  return INTERVIEW_SCENARIOS.find((s) => s.id === id);
}

// === Hint chips: starter phrases to help learners begin answering ===
export type ScenarioHint = { jp: string; ro: string };

const DEFAULT_HINTS: ScenarioHint[] = [
  { jp: "はじめまして。", ro: "hajimemashite" },
  { jp: "インドネシアから来ました。", ro: "indoneshia kara kimashita" },
  { jp: "よろしくお願いします。", ro: "yoroshiku onegaishimasu" },
];

const SCENARIO_HINTS: Record<string, ScenarioHint[]> = {
  iv_kaigo: [
    { jp: "はじめまして。", ro: "hajimemashite" },
    { jp: "インドネシアから来ました。", ro: "indoneshia kara kimashita" },
    { jp: "よろしくお願いします。", ro: "yoroshiku onegaishimasu" },
  ],
};

export function getScenarioHints(id: string): ScenarioHint[] {
  return SCENARIO_HINTS[id] ?? DEFAULT_HINTS;
}

// === Recommendations based on user level ===
export function getRecommendedScenarios(currentLevelOrder: number | null): InterviewScenario[] {
  // Always feature the demo Kaigo scenario first
  const kaigo = INTERVIEW_SCENARIOS.find((s) => s.id === "iv_kaigo");
  const targetLevel: InterviewScenario["level"] =
    currentLevelOrder == null || currentLevelOrder <= 1
      ? "N5"
      : currentLevelOrder >= 4
        ? "N3"
        : "N4";
  const others = INTERVIEW_SCENARIOS.filter(
    (s) => s.id !== "iv_kaigo" && s.level === targetLevel,
  );
  const second = others[0] ?? INTERVIEW_SCENARIOS.find((s) => s.id !== "iv_kaigo");
  const out: InterviewScenario[] = [];
  if (kaigo) out.push(kaigo);
  if (second) out.push(second);
  return out;
}
