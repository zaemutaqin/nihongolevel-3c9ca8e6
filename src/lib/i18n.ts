import { useSyncExternalStore } from "react";

export type Lang = "id" | "en";
const LS_KEY = "nihongo_lang";
const EVT = "nihongo_lang_change";

export function getLang(): Lang {
  if (typeof window === "undefined") return "id";
  const v = window.localStorage.getItem(LS_KEY);
  return v === "en" ? "en" : "id";
}

export function setLang(lang: Lang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, lang);
  window.dispatchEvent(new CustomEvent(EVT));
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, () => "id");
}

type Dict = Record<string, string | string[]>;

const ID: Dict = {
  // Nav
  "nav.search": "Cari",
  "nav.home": "Beranda",
  "nav.history": "Riwayat",
  "nav.favorites": "Favorit",
  "nav.dashboard": "Levelku",
  "nav.review": "Latihan Harian",
  "nav.search_short": "Cari",
  "nav.home_short": "Beranda",
  "nav.history_short": "Riwayat",
  "nav.favorites_short": "Favorit",
  "nav.dashboard_short": "Levelku",
  "nav.review_short": "Latihan",
  "nav.interview_short": "Interview",
  "nav.translate_short": "Translator",

  // Home
  "home.title": "Translator Jepang untuk Kerja & Kehidupan",
  "home.subtitle": "Dapatkan 4 level: Casual, Polite, Workplace, dan Keigo — siap dipakai di tempat kerja Jepang.",
  "home.inputLabel": "Kalimat Bahasa Indonesia",
  "home.placeholder": "Ketik situasi atau kalimat dalam Bahasa Indonesia...",
  "home.addContext": "Tambah konteks (opsional)",
  "home.listenerLabel": "Kepada siapa kamu berbicara?",
  "home.moodLabel": "Bagaimana suasananya?",
  "home.shortcut": "Tekan",
  "home.searchBtn": "Cari ekspresi",
  "home.searching": "Mencari...",
  "home.examplesLabel": "Contoh cepat:",
  "home.resultHeader": "Bagaimana orang Jepang mengatakannya",
  "home.styleSubheader": "Pilihan ekspresi berdasarkan gaya komunikasi",
  "home.fromCache": "Dari cache",
  "home.errEmpty": "Silakan masukkan kalimat terlebih dahulu.",
  "home.footer": "Dibuat untuk belajar bahasa Jepang ✿",

  // Listener / mood options
  "opt.listener.unknown": "Belum tahu / tidak relevan",
  "opt.listener.self": "Diri sendiri",
  "opt.listener.friend": "Teman dekat / sebaya",
  "opt.listener.colleague": "Rekan kerja / kolega",
  "opt.listener.senior": "Atasan / senior",
  "opt.listener.client": "Klien / orang baru",
  "opt.listener.younger": "Orang yang lebih muda",
  "opt.mood.normal": "Percakapan biasa",
  "opt.mood.casual": "Santai / sedang bercanda",
  "opt.mood.serious": "Serius / penting",
  "opt.mood.upset": "Sedang emosi / kesal",
  "opt.mood.happy": "Senang / antusias",
  "opt.mood.awkward": "Canggung / tidak nyaman",

  // Style names (by JLPT-equivalent key)
  "style.N4": "Casual",
  "style.N3": "Polite (Desu/Masu)",
  "style.N2": "Workplace",
  "style.N1": "Keigo (敬語)",
  "style.equiv": "setara JLPT",

  // Naturalness
  "nat.native": "Sangat Umum",
  "nat.stiff": "Cukup Umum",
  "nat.textbook": "Jarang Digunakan",
  "nat.label": "Seberapa sering diucapkan:",

  // Intent
  "intent.monolog": "Monolog / berpikir sendiri",
  "intent.monolog_short": "Monolog",
  "intent.asking_others": "Tanya ke orang lain",
  "intent.asking_others_short": "Tanya ke orang",
  "intent.casual_conversation": "Percakapan kasual / akrab",
  "intent.casual_conversation_short": "Kasual",
  "intent.professional_formal": "Konteks profesional / formal",
  "intent.professional_formal_short": "Profesional",
  "intent.joking_relaxed": "Bercanda / santai",
  "intent.joking_relaxed_short": "Bercanda",

  // Result parts
  "rp.whenUsed": "Kapan dipakai: ",
  "rp.viewDetails": "Lihat detail",
  "rp.hide": "Sembunyikan",
  "rp.saveFav": "Simpan favorit",
  "rp.saved": "Tersimpan",
  "rp.grammar": "Tata Bahasa",
  "rp.kanji": "Kanji",
  "rp.suitableFor": "Cocok diucapkan kepada",
  "rp.impression": "Kesan yang diterima lawan bicara",
  "rp.whyLevel": "Kenapa level ini?",
  "rp.alsoIn": "Kanji ini juga muncul dalam:",
  "rp.kanjiFreq.sangat_umum": "Sangat Umum",
  "rp.kanjiFreq.umum": "Umum",
  "rp.kanjiFreq.khusus": "Khusus",

  // Social analysis
  "sa.title": "Analisis Situasi",
  "sa.relationship": "Hubungan sosial",
  "sa.emotion": "Emosi / tone",
  "sa.goal": "Tujuan komunikasi",
  "sa.risk": "Risiko salah konteks",

  // Most natural
  "mn.label": "Yang paling natural",
  "mn.badge": "✓ Inilah yang akan terdengar alami bagi penutur asli",
  "mn.why": "Mengapa ini yang paling natural?",
  "mn.savedFav": "Tersimpan di Favorit",
  "mn.saveFav": "⭐ Simpan ke Favorit",

  // Alternatives
  "alt.title": "Alternatif berdasarkan situasi",
  "alt.fallback": "Pilihan",

  // Favorit
  "fav.title": "Favorit",
  "fav.filter.all": "Semua",
  "fav.from": "Dari:",
  "fav.empty.title": "Belum ada ekspresi favorit",
  "fav.empty.desc": "Tandai ekspresi yang ingin kamu gunakan dalam kehidupan nyata.",
  "fav.nuance": "Nuansa: ",
  "fav.confirmDelete": "Hapus favorit ini?",

  // Riwayat
  "hist.title": "Riwayat",
  "hist.searchPlaceholder": "Cari kalimat, ekspresi Jepang, atau situasi...",
  "hist.empty.title": "Belum ada percakapan tersimpan",
  "hist.empty.desc": "Coba masukkan situasi pertamamu — misalnya 'Hari ini aku capek banget'.",
  "hist.confirmDelete": "Hapus entri ini?",

  // Dashboard
  "dash.title": "Levelku",
  "dash.subtitle": "Pantau kemajuan dan latihan ekspresi favoritmu setiap hari.",
  "dash.today": "Hari ini",
  "dash.needReview": "Perlu diulang hari ini",
  "dash.expressions": "ekspresi",
  "dash.streak": "hari berturut-turut",
  "dash.allReviewed": "Semua ekspresi sudah diulang. Bagus! 🎉",
  "dash.startFrom": "Mulai dari ini",
  "dash.startPractice": "Mulai Latihan",
  "dash.untried": "Situasi yang belum kamu coba",
  "dash.allTried": "Hebat! Kamu sudah pernah mencoba semua situasi. Coba variasi lain di halaman Cari.",
  "dash.tapToTry": "Ketuk salah satu untuk mencobanya.",
  "dash.patterns": "Pola belajarmu",
  "dash.topIntent": "Situasi paling sering",
  "dash.topStyle": "Gaya bicara favoritmu",
  "dash.noData": "Belum ada data.",
  "dash.styleAppeared": "Muncul",
  "dash.styleAppearedSuffix": "× di favoritmu —",
  "dash.styleHint": "Simpan favorit untuk melihat gaya bicara yang paling kamu sukai.",
  "dash.totalLearned": "Total kalimat dipelajari",
  "dash.allTime": "sepanjang waktu",
  "dash.thisWeek": "Minggu ini",
  "dash.searches7d": "pencarian dalam 7 hari",
  "dash.almostForgot": "Ekspresi yang hampir terlupakan",
  "dash.noFavYet": "Belum ada favorit. Simpan dulu beberapa ekspresi untuk diulang nanti.",
  "dash.lastSeen": "Terakhir dilihat",
  "dash.reviewNow": "Ulang sekarang",
  "dash.daysAgo.never": "belum pernah diulang",
  "dash.daysAgo.today": "hari ini",
  "dash.daysAgo.oneDay": "1 hari lalu",
  "dash.daysAgo.suffix": "hari lalu",

  // Quick review modal
  "qrm.q": "Ingat ekspresi ini?",
  "qrm.show": "Lihat jawaban",
  "qrm.forgot": "Lupa",
  "qrm.remember": "Ingat",
  "qrm.close": "Tutup",

  // Review page
  "rev.title": "Latihan Harian",
  "rev.tab.flash": "Ulang Ekspresi",
  "rev.tab.situ": "Latihan Situasi",
  "rev.empty.title": "Belum ada yang perlu diulang",
  "rev.empty.desc": "Tambahkan ekspresi ke favorit untuk mulai latihan.",
  "rev.sessionDone": "Sesi selesai!",
  "rev.reviewed": "Kamu sudah mengulang",
  "rev.expressionsToday": "ekspresi hari ini.",
  "rev.newSession": "Mulai sesi baru",
  "rev.readyToday": "ekspresi siap diulang hari ini",
  "rev.tryRemember": "Coba ingat dalam Bahasa Jepang",
  "rev.showAnswer": "Lihat jawaban",

  // Situasi
  "sit.empty.title": "Belum ada tantangan tersedia",
  "sit.empty.desc": "Cari beberapa ekspresi dulu di halaman Cari — tantangan akan dibuat otomatis dari riwayatmu.",
  "sit.done": "Sesi tantangan selesai!",
  "sit.totalToday": "Total tantangan hari ini:",
  "sit.newSession": "Sesi baru",
  "sit.available": "tantangan tersedia dari riwayat belajarmu",
  "sit.sessionProgress": "selesai sesi ini",
  "sit.challenge": "Tantangan",
  "sit.knowHow": "Kamu sudah tahu cara bilang ini ke teman:",
  "sit.howToBoss": "Sekarang, bagaimana kamu mengatakannya kepada",
  "sit.boss": "ATASAN",
  "sit.attemptPlaceholder": "Tulis upayamu di sini (Bahasa Jepang atau Indonesia)...",
  "sit.showIdeal": "Lihat jawaban ideal",
  "sit.formalVersion": "Versi formal / keigo",
  "sit.yourAnswer": "Jawabanmu",
  "sit.mainDiff": "Perbedaan utama",
  "sit.closeEnough": "Apakah jawabanmu mendekati ini?",
  "sit.no": "Belum",
  "sit.yes": "Iya",

  // Errors
  "err.FORBIDDEN_ORIGIN": "Permintaan tidak diizinkan. Buka aplikasi dari situs resmi.",
  "err.RATE_LIMITED": "Terlalu banyak permintaan. Coba lagi dalam beberapa saat.",
  "err.CREDITS_EXHAUSTED": "Layanan sedang tidak tersedia. Coba lagi nanti.",
  "err.AI_UNAVAILABLE": "Layanan AI tidak tersedia. Coba lagi nanti.",
  "err.INVALID_RESPONSE": "Gagal memproses respons. Coba lagi.",
  "err.SERVER_MISCONFIGURED": "Layanan belum siap. Coba lagi nanti.",
  "err.generic": "Gagal memproses. Coba lagi.",

  // Examples
  "examples": [
    "hari ini makan apa ya?",
    "Boleh saya pulang lebih awal?",
    "Saya tidak bisa hadir rapat besok",
    "Terima kasih sudah membantu",
  ],

  // Suggestions per intent (dashboard untried)
  "sugg.monolog": "Aku lagi capek banget nih...",
  "sugg.asking_others": "Kamu mau makan apa nanti?",
  "sugg.casual_conversation": "Eh udah lama nggak ketemu!",
  "sugg.professional_formal": "Apakah laporan sudah selesai?",
  "sugg.joking_relaxed": "Eh kamu serius nggak sih?",

  // Misc
  "misc.deleteAria": "Hapus",
  "misc.poweredBy": "Powered by Gemini",
};

const EN: Dict = {
  "nav.search": "Search",
  "nav.home": "Home",
  "nav.history": "History",
  "nav.favorites": "Favorites",
  "nav.dashboard": "My Level",
  "nav.review": "Daily Practice",
  "nav.search_short": "Search",
  "nav.home_short": "Home",
  "nav.history_short": "History",
  "nav.favorites_short": "Favorites",
  "nav.dashboard_short": "My Level",
  "nav.review_short": "Practice",
  "nav.interview_short": "Interview",
  "nav.translate_short": "Translator",

  "home.title": "Learn to Speak Natural Japanese",
  "home.subtitle": "Learn to speak like a native Japanese",
  "home.inputLabel": "Sentence in English",
  "home.placeholder": "Type a situation or sentence in English...",
  "home.addContext": "Add context (optional)",
  "home.listenerLabel": "Who are you speaking to?",
  "home.moodLabel": "What's the mood?",
  "home.shortcut": "Press",
  "home.searchBtn": "Find expression",
  "home.searching": "Searching...",
  "home.examplesLabel": "Quick examples:",
  "home.resultHeader": "How Japanese people say it",
  "home.styleSubheader": "Expression options by communication style",
  "home.fromCache": "From cache",
  "home.errEmpty": "Please enter a sentence first.",
  "home.footer": "Made for learning Japanese ✿",

  "opt.listener.unknown": "Unknown / not relevant",
  "opt.listener.self": "Myself",
  "opt.listener.friend": "Close friend / peer",
  "opt.listener.colleague": "Coworker / colleague",
  "opt.listener.senior": "Boss / senior",
  "opt.listener.client": "Client / stranger",
  "opt.listener.younger": "Someone younger",
  "opt.mood.normal": "Normal conversation",
  "opt.mood.casual": "Relaxed / joking",
  "opt.mood.serious": "Serious / important",
  "opt.mood.upset": "Emotional / upset",
  "opt.mood.happy": "Happy / excited",
  "opt.mood.awkward": "Awkward / uncomfortable",

  "style.N4": "Casual",
  "style.N3": "Polite (Desu/Masu)",
  "style.N2": "Workplace",
  "style.N1": "Keigo (敬語)",
  "style.equiv": "JLPT equiv.",

  "nat.native": "Very Common",
  "nat.stiff": "Fairly Common",
  "nat.textbook": "Rarely Used",
  "nat.label": "How often it's said:",

  "intent.monolog": "Monologue / thinking to yourself",
  "intent.monolog_short": "Monologue",
  "intent.asking_others": "Asking others",
  "intent.asking_others_short": "Asking",
  "intent.casual_conversation": "Casual / friendly conversation",
  "intent.casual_conversation_short": "Casual",
  "intent.professional_formal": "Professional / formal context",
  "intent.professional_formal_short": "Professional",
  "intent.joking_relaxed": "Joking / relaxed",
  "intent.joking_relaxed_short": "Joking",

  "rp.whenUsed": "When to use: ",
  "rp.viewDetails": "View details",
  "rp.hide": "Hide",
  "rp.saveFav": "Save favorite",
  "rp.saved": "Saved",
  "rp.grammar": "Grammar",
  "rp.kanji": "Kanji",
  "rp.suitableFor": "Suitable for",
  "rp.impression": "Impression on listener",
  "rp.whyLevel": "Why this level?",
  "rp.alsoIn": "This kanji also appears in:",
  "rp.kanjiFreq.sangat_umum": "Very common",
  "rp.kanjiFreq.umum": "Common",
  "rp.kanjiFreq.khusus": "Specialized",

  "sa.title": "Situation Analysis",
  "sa.relationship": "Social relationship",
  "sa.emotion": "Emotion / tone",
  "sa.goal": "Communication goal",
  "sa.risk": "Wrong-context risk",

  "mn.label": "The most natural",
  "mn.badge": "✓ This is what will sound natural to native speakers",
  "mn.why": "Why is this the most natural?",
  "mn.savedFav": "Saved to Favorites",
  "mn.saveFav": "⭐ Save to Favorites",

  "alt.title": "Alternatives by situation",
  "alt.fallback": "Option",

  "fav.title": "Favorites",
  "fav.filter.all": "All",
  "fav.from": "From:",
  "fav.empty.title": "No favorite expressions yet",
  "fav.empty.desc": "Save expressions you want to use in real life.",
  "fav.nuance": "Nuance: ",
  "fav.confirmDelete": "Delete this favorite?",

  "hist.title": "History",
  "hist.searchPlaceholder": "Search a sentence, Japanese expression, or situation...",
  "hist.empty.title": "No saved conversations yet",
  "hist.empty.desc": "Try entering your first situation — e.g. 'I'm so tired today'.",
  "hist.confirmDelete": "Delete this entry?",

  "dash.title": "My Level",
  "dash.subtitle": "Track your progress and practice favorite expressions daily.",
  "dash.today": "Today",
  "dash.needReview": "To review today",
  "dash.expressions": "expressions",
  "dash.streak": "day streak",
  "dash.allReviewed": "All expressions reviewed. Great job! 🎉",
  "dash.startFrom": "Start with this",
  "dash.startPractice": "Start Practice",
  "dash.untried": "Situations you haven't tried",
  "dash.allTried": "Awesome! You've tried every situation. Explore variations on the Search page.",
  "dash.tapToTry": "Tap one to try it.",
  "dash.patterns": "Your learning patterns",
  "dash.topIntent": "Most common situation",
  "dash.topStyle": "Your favorite style",
  "dash.noData": "No data yet.",
  "dash.styleAppeared": "Appeared",
  "dash.styleAppearedSuffix": "× in your favorites —",
  "dash.styleHint": "Save favorites to see your most-used style.",
  "dash.totalLearned": "Total sentences learned",
  "dash.allTime": "all-time",
  "dash.thisWeek": "This week",
  "dash.searches7d": "searches in 7 days",
  "dash.almostForgot": "Almost-forgotten expressions",
  "dash.noFavYet": "No favorites yet. Save a few expressions to review later.",
  "dash.lastSeen": "Last seen",
  "dash.reviewNow": "Review now",
  "dash.daysAgo.never": "never reviewed",
  "dash.daysAgo.today": "today",
  "dash.daysAgo.oneDay": "1 day ago",
  "dash.daysAgo.suffix": "days ago",

  "qrm.q": "Remember this expression?",
  "qrm.show": "Show answer",
  "qrm.forgot": "Forgot",
  "qrm.remember": "Remember",
  "qrm.close": "Close",

  "rev.title": "Daily Practice",
  "rev.tab.flash": "Review Expressions",
  "rev.tab.situ": "Situation Practice",
  "rev.empty.title": "Nothing to review yet",
  "rev.empty.desc": "Add expressions to favorites to start practicing.",
  "rev.sessionDone": "Session complete!",
  "rev.reviewed": "You've reviewed",
  "rev.expressionsToday": "expressions today.",
  "rev.newSession": "Start new session",
  "rev.readyToday": "expressions ready to review today",
  "rev.tryRemember": "Try to recall in Japanese",
  "rev.showAnswer": "Show answer",

  "sit.empty.title": "No challenges available yet",
  "sit.empty.desc": "Search a few expressions first — challenges will be generated from your history.",
  "sit.done": "Challenge session complete!",
  "sit.totalToday": "Total challenges today:",
  "sit.newSession": "New session",
  "sit.available": "challenges available from your learning history",
  "sit.sessionProgress": "done this session",
  "sit.challenge": "Challenge",
  "sit.knowHow": "You already know how to say this to a friend:",
  "sit.howToBoss": "Now, how would you say it to your",
  "sit.boss": "BOSS",
  "sit.attemptPlaceholder": "Write your attempt here (Japanese or English)...",
  "sit.showIdeal": "Show ideal answer",
  "sit.formalVersion": "Formal / keigo version",
  "sit.yourAnswer": "Your answer",
  "sit.mainDiff": "Main differences",
  "sit.closeEnough": "Is your answer close to this?",
  "sit.no": "Not yet",
  "sit.yes": "Yes",

  "err.FORBIDDEN_ORIGIN": "Request not allowed. Open the app from the official site.",
  "err.RATE_LIMITED": "Too many requests. Please try again shortly.",
  "err.CREDITS_EXHAUSTED": "Service unavailable. Please try again later.",
  "err.AI_UNAVAILABLE": "AI service unavailable. Please try again later.",
  "err.INVALID_RESPONSE": "Failed to process the response. Please try again.",
  "err.SERVER_MISCONFIGURED": "Service not ready. Please try again later.",
  "err.generic": "Failed to process. Please try again.",

  "examples": [
    "What should I eat today?",
    "Can I leave early today?",
    "I can't attend tomorrow's meeting",
    "Thank you for your help",
  ],

  "sugg.monolog": "I'm so tired right now...",
  "sugg.asking_others": "What do you want to eat later?",
  "sugg.casual_conversation": "Hey, long time no see!",
  "sugg.professional_formal": "Has the report been completed?",
  "sugg.joking_relaxed": "Wait, are you serious?",

  "misc.deleteAria": "Delete",
  "misc.poweredBy": "Powered by Gemini",
};

const DICTS: Record<Lang, Dict> = { id: ID, en: EN };

export function useT() {
  const lang = useLang();
  const d = DICTS[lang];
  function t(key: string): string {
    const v = d[key];
    if (typeof v === "string") return v;
    const fb = ID[key];
    return typeof fb === "string" ? fb : key;
  }
  function tList(key: string): string[] {
    const v = d[key];
    if (Array.isArray(v)) return v;
    const fb = ID[key];
    return Array.isArray(fb) ? fb : [];
  }
  return { t, tList, lang };
}
