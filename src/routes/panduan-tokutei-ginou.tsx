import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import {
  Briefcase,
  CheckCircle2,
  Circle,
  BookOpen,
  MessageCircle,
  Plane,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  Globe,
  ArrowRight,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/panduan-tokutei-ginou")({
  head: () => ({
    meta: [
      {
        title:
          "Panduan Lengkap Tokutei Ginou (SSW) 2026 — Kerja di Jepang | Nihongolive",
      },
      {
        name: "description",
        content:
          "Panduan lengkap program Tokutei Ginou (Specified Skilled Worker / SSW) untuk pekerja Indonesia. Syarat, biaya, 14 sektor, ujian, dan cara latih wawancara bahasa Jepang.",
      },
      {
        property: "og:title",
        content: "Panduan Lengkap Tokutei Ginou (SSW) 2026 — Kerja di Jepang",
      },
      {
        property: "og:description",
        content:
          "Syarat, biaya, 14 sektor, ujian, dan cara latih wawancara bahasa Jepang untuk program SSW.",
      },
      { property: "og:url", content: "/panduan-tokutei-ginou" },
    ],
    links: [
      { rel: "canonical", href: "/panduan-tokutei-ginou" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Panduan Lengkap Tokutei Ginou (Specified Skilled Worker / SSW) untuk Pekerja Indonesia",
          description:
            "Syarat, biaya, 14 sektor, ujian, dan cara latih wawancara bahasa Jepang untuk program SSW.",
          url: "https://nihongo.live/panduan-tokutei-ginou",
          author: {
            "@type": "Organization",
            name: "Nihongolive",
          },
          publisher: {
            "@type": "Organization",
            name: "Nihongolive",
            logo: {
              "@type": "ImageObject",
              url: "https://nihongo.live/favicon.ico",
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": "https://nihongo.live/panduan-tokutei-ginou",
          },
          datePublished: "2026-06-26",
          dateModified: "2026-06-26",
        }),
      },
    ],
  }),
  component: PanduanTokuteiGinouPage,
});

const TOC_ITEMS = [
  { id: "apa-itu", label: "Apa Itu Tokutei Ginou?" },
  { id: "sektor", label: "14 Sekter yang Dibuka" },
  { id: "syarat", label: "Syarat & Ketentuan" },
  { id: "proses", label: "Tahapan dari Nol sampai Berangkat" },
  { id: "biaya", label: "Estimasi Biaya" },
  { id: "ujian", label: "Ujian Bahasa & Skill Test" },
  { id: "wawancara", label: "Persiapan Wawancara" },
  { id: "latih", label: "Latih Wawancara dengan AI" },
];

const SECTORS = [
  { name: "Kaigo (Perawatan Lansia)", icon: "👵", desc: "Panti jompo, home care, perawatan lansia" },
  { name: "Akomodasi / Perhotelan", icon: "🏨", desc: "Front desk, housekeeping, room service" },
  { name: "Restoran & Jasa Boga", icon: "🍱", desc: "Waiter, kitchen helper, restoran" },
  { name: "Pembersihan Gedung", icon: "🧹", desc: "Cleaning service gedung perkantoran" },
  { name: "Suku Cadang Mesin", icon: "⚙️", desc: "Pabrik casting, forging, mold" },
  { name: "Permesinan Pabrik", icon: "🛠️", desc: "Perakitan & maintenance mesin industri" },
  { name: "Listrik & Elektronik", icon: "🔌", desc: "PCB, soldering, assembly elektronik" },
  { name: "Konstruksi", icon: "🏗️", desc: "Pekerja lapangan, scaffolding, beton" },
  { name: "Maritim & Perkapalan", icon: "🚢", desc: "Galangan kapal, welding, steel work" },
  { name: "Makanan & Minuman Olahan", icon: "🥫", desc: "Pabrik makanan & minuman (HACCP)" },
  { name: "Otomotif", icon: "🔧", desc: "Bengkel, perawatan & perbaikan kendaraan" },
  { name: "Penerbangan", icon: "✈️", desc: "Ground handling, line maintenance" },
  { name: "Perkeretaapian", icon: "🚆", desc: "Perawatan rel, sinyal, stasiun" },
  { name: "Transportasi Publik", icon: "🚌", desc: "Driver bus/taksi (butuh SIM Jepang)" },
];

const STEPS = [
  { num: 1, title: "Pelajari Bahasa Jepang (N4–N5)", desc: "Mulai dari Hiragana, Katakana, kosakata dasar, hingga percakapan N4. Nihongolive menyediakan kurikulum dari nol." },
  { num: 2, title: "Ikut Ujian JLPT / JFT", desc: "Minimal N4 untuk Tokutei Ginou No. 1 (14 sektor) atau N5 untuk sektor perawatan & restoran." },
  { num: 3, title: "Skill Test Sektor", desc: "Ambil ujian skill sesuai bidangmu di negara mitra (Indonesia biasanya via JITCO / LPK)." },
  { num: 4, title: "Cari Sending Organization (SO)", desc: "Daftar ke LPK/BLKP yang bekerja sama dengan perusahaan Jepang. Verifikasi lisensi SO." },
  { num: 5, title: "Wawancara dengan Perusahaan Jepang", desc: "HR Jepang akan wawancara via video call. Bahasa Jepang, motivasi, dan sikap diuji di sini." },
  { num: 6, title: "COE & Visa", desc: "Perusahaan di Jepang ajukan Certificate of Eligibility (COE). Setelah keluar, urus visa SSW di Kedubes Jepang." },
  { num: 7, title: "Berangkat & Kerja", desc: "Tiba di Jepang, orientasi, kontrak kerja, mulai bekerja 5 hari/minggu dengan perlindungan hukum setara pekerja Jepang." },
];

const BIAYA_ROWS = [
  { item: "Kursus bahasa Jepang (6–12 bulan)", range: "Rp 8–25 juta" },
  { item: "Ujian JLPT / JFT", range: "Rp 350–700 ribu" },
  { item: "Ujian skill test", range: "Rp 1–3 juta" },
  { item: "Proses administrasi SO", range: "Rp 5–15 juta" },
  { item: "Visa & keberangkatan", range: "Rp 3–7 juta" },
  { item: "Biaya hidup awal (1 bulan)", range: "¥100.000–200.000", note: "sering dipinjamkan majikan" },
];

function SectionHeading({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2 id={id} className="text-xl sm:text-2xl font-bold tracking-tight mt-12 mb-4 scroll-mt-24">
      {children}
    </h2>
  );
}

function PanduanTokuteiGinouPage() {
  const { t, lang } = useT();
  const isId = lang === "id";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link to="/" className="font-bold text-lg">
          Nihongo<span className="text-primary">Live</span>
        </Link>
        <Link
          to="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {isId ? "Kembali" : "Back"}
        </Link>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 text-violet-700 px-3 py-1 text-xs font-semibold mb-3">
            <Globe className="w-3.5 h-3.5" />
            {isId ? "Panduan Kerja di Jepang 2026" : "Japan Work Guide 2026"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isId
              ? "Panduan Lengkap Tokutei Ginou (SSW)"
              : "Complete Guide to Tokutei Ginou (SSW)"}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {isId
              ? "Syarat, biaya, 14 sektor pekerjaan, dan cara latih wawancara bahasa Jepang untuk program Specified Skilled Worker. Dari nol sampai terbang ke Jepang."
              : "Requirements, costs, 14 job sectors, and how to practice Japanese interviews for the SSW program. From zero to flying to Japan."}
          </p>
        </div>

        {/* TOC */}
        <nav className="mt-10 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-3">
            {isId ? "Daftar Isi" : "Table of Contents"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {TOC_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition"
              >
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {isId ? item.label : item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* 1. Apa itu */}
        <SectionHeading id="apa-itu">
          {isId ? "Apa Itu Tokutei Ginou?" : "What Is Tokutei Ginou?"}
        </SectionHeading>
        <p className="text-muted-foreground leading-relaxed">
          {isId
            ? "Tokutei Ginou (特定技能), atau dalam bahasa Inggris disebut Specified Skilled Worker (SSW), adalah visa kerja resmi Jepang yang mulai berlaku sejak April 2019. Program ini dibuka karena Jepang menghadapi krisis tenaga kerja akibat populasi yang menua (超少子高齢化)."
            : "Tokutei Ginou (特定技能), or Specified Skilled Worker (SSW), is an official Japanese work visa that has been in effect since April 2019. It was created because Japan faces a labor crisis due to an aging population."}
        </p>
        <p className="text-muted-foreground leading-relaxed mt-3">
          {isId
            ? "Visa SSW memungkinkan warga negara asing — termasuk Indonesia — bekerja di 14 sektor industri tertentu di Jepang selama maksimal 5 tahun. Bedanya dengan Technical Intern Training (TITP/ former JITCO): SSW memberikan perlindungan hukum dan gaji setara dengan pekerja Jepang, serta kebebasan pindah perusahaan setelah jangka waktu tertentu."
            : "The SSW visa allows foreign nationals — including Indonesians — to work in 14 specific industrial sectors in Japan for up to 5 years. Unlike the old Technical Intern Training program, SSW provides equal legal protection and pay as Japanese workers, plus the ability to change employers after a set period."}
        </p>
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-600" />
              {isId ? "Gaji & Perlindungan" : "Salary & Protection"}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {isId
                ? "Gaji setara pekerja Jepang (minimum ¥180.000–250.000/bulan tergantung daerah). Lembur dibayar. BPJS/penjaminan sosial Jepang berlaku."
                : "Equal pay as Japanese workers (minimum ¥180,000–250,000/month depending on region). Overtime paid. Social insurance applies."}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Plane className="w-4 h-4 text-violet-600" />
              {isId ? "Durasi & Perpindahan" : "Duration & Mobility"}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {isId
                ? "Visa berlaku 5 tahun. Setelah 1–2 tahun di perusahaan pertama, pekerja boleh pindah ke perusahaan lain dalam sektor yang sama."
                : "Visa valid for 5 years. After 1–2 years at the first company, workers may switch to another company in the same sector."}
            </p>
          </div>
        </div>

        {/* 2. Sektor */}
        <SectionHeading id="sektor">
          {isId ? "14 Sektor yang Dibuka" : "14 Open Sectors"}
        </SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          {isId
            ? "Ini 14 sektor yang tersedia di bawah program Tokutei Ginou No. 1 dan No. 2. Pilih yang sesuai dengan latar belakang dan minatmu."
            : "These are the 14 sectors available under the Tokutei Ginou No. 1 and No. 2 programs. Choose one that matches your background and interests."}
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {SECTORS.map((s) => (
            <div key={s.name} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
              <span className="text-xl" aria-hidden>{s.icon}</span>
              <div>
                <h4 className="font-semibold text-sm">{s.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Syarat */}
        <SectionHeading id="syarat">
          {isId ? "Syarat & Ketentuan" : "Requirements & Conditions"}
        </SectionHeading>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">
                {isId ? "Bahasa Jepang" : "Japanese Language"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isId
                  ? "Minimal JLPT N4 untuk No. 1 (semua sektor) atau N5 khusus untuk sektor perawatan & restoran. Untuk No. 2 (pengalaman 3+ tahun) butuh N3."
                  : "Minimum JLPT N4 for No. 1 (all sectors) or N5 specifically for nursing care & restaurant sectors. No. 2 (3+ years experience) requires N3."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">
                {isId ? "Skill Test" : "Skill Test"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isId
                  ? "Lulus ujian skill sesuai sektor di lembaga resmi. Contoh: Kaigo Shien (介護) untuk perawatan, atau ujian sektor lain melalui JITCO/BADAN LPK."
                  : "Pass the sector-specific skill test at an authorized institution. Example: Kaigo Shien for nursing care, or other sector exams via JITCO/LPK."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">
                {isId ? "Usia & Kesehatan" : "Age & Health"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isId
                  ? "Umumnya 18–40 tahun, tergantung kebijakan SO dan perusahaan Jepang. Wajib sehat jasmani & rohani, bebas narkoba."
                  : "Generally 18–40 years old, depending on SO and Japanese company policies. Must be physically & mentally healthy, drug-free."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">
                {isId ? "Pendidikan" : "Education"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isId
                  ? "Minimal SMA/sederajat. Tidak harus sarjana. Sertifikat vokasional atau pengalaman kerja di bidang terkait menjadi nilai tambah."
                  : "Minimum high school diploma. No degree required. Vocational certificates or relevant work experience are a plus."}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Proses */}
        <SectionHeading id="proses">
          {isId ? "Tahapan dari Nol sampai Berangkat" : "Step-by-Step from Zero to Departure"}
        </SectionHeading>
        <div className="space-y-6 relative pl-4">
          <div className="absolute left-[1.15rem] top-2 bottom-2 w-px bg-border" />
          {STEPS.map((step) => (
            <div key={step.num} className="relative pl-8">
              <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center ring-4 ring-background">
                {step.num}
              </div>
              <h4 className="font-semibold text-sm">{step.title}</h4>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* 5. Biaya */}
        <SectionHeading id="biaya">
          {isId ? "Estimasi Biaya" : "Estimated Costs"}
        </SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          {isId
            ? "Total biaya bervariasi tergantung jalur (LPK mandiri atau SO). Ini estimasi per Juni 2026."
            : "Total costs vary depending on the route (independent LPK or SO). These are estimates as of June 2026."}
        </p>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-2.5 font-semibold text-foreground">{isId ? "Komponen" : "Component"}</th>
                <th className="text-right px-4 py-2.5 font-semibold text-foreground">{isId ? "Estimasi" : "Estimate"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {BIAYA_ROWS.map((row) => (
                <tr key={row.item} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{row.item}</td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{row.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {isId
            ? "Total estimasi: Rp 20–55 juta. Beberapa SO menawarkan skema pinjaman atau potong gaji bertahap. Pastikan SO memiliki lisensi resmi dari Kemenaker Indonesia dan perjanjian dengan badan Jepang (JITCO/OTIT)."
            : "Total estimate: Rp 20–55 million. Some SOs offer loan schemes or gradual salary deductions. Make sure the SO has an official license from the Indonesian Ministry of Manpower and an agreement with Japanese bodies (JITCO/OTIT)."}
        </p>

        {/* 6. Ujian */}
        <SectionHeading id="ujian">
          {isId ? "Ujian Bahasa & Skill Test" : "Language & Skill Tests"}
        </SectionHeading>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="font-semibold text-sm">JLPT (Japanese Language Proficiency Test)</h4>
            <p className="text-sm text-muted-foreground mt-2">
              {isId
                ? "Ujian standar internasional. Diadakan 2 kali setahun (Juli & Desember). Minimal N4 untuk SSW No. 1. Daftar di loket.bkksmg.id atau situs resmi JLPT di negaramu."
                : "International standard exam. Held twice a year (July & December). Minimum N4 for SSW No. 1. Register at your local JLPT website."}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="font-semibold text-sm">JFT-Basic</h4>
            <p className="text-sm text-muted-foreground mt-2">
              {isId
                ? "Alternatif JLPT yang lebih sering jadwalnya (hampir tiap bulan). Hasil keluar lebih cepat. Diterima untuk keperluan visa SSW."
                : "An alternative to JLPT with more frequent sessions (almost monthly). Results come out faster. Accepted for SSW visa purposes."}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="font-semibold text-sm">Skill Test (Kensa)</h4>
            <p className="text-sm text-muted-foreground mt-2">
              {isId
                ? "Ujian praktik dan teori sesuai sektor. Contoh: ujian perawatan lansia (kaigo), food safety, atau welding test. Di Indonesia biasanya melalui JITCO, BADAN LPK, atau lembaga mitra Jepang lainnya."
                : "Practical and theoretical exam per sector. Example: elderly care (kaigo) exam, food safety, or welding test. In Indonesia, usually through JITCO, BADAN LPK, or other Japanese partner institutions."}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="font-semibold text-sm">Prometric / Computer-Based Test</h4>
            <p className="text-sm text-muted-foreground mt-2">
              {isId
                ? "Beberapa sektor menggunakan tes berbasis komputer untuk menilai pengetahuan industri dan keselamatan kerja."
                : "Some sectors use computer-based tests to assess industry knowledge and workplace safety."}
            </p>
          </div>
        </div>

        {/* 7. Wawancara */}
        <SectionHeading id="wawancara">
          {isId ? "Persiapan Wawancara Bahasa Jepang" : "Preparing for the Japanese Interview"}
        </SectionHeading>
        <p className="text-muted-foreground leading-relaxed">
          {isId
            ? "Wawancara dengan perusahaan Jepang biasanya berlangsung 15–30 menit dalam bahasa Jepang (level N4–N3). Pewawancara menilai: (1) kemampuan bahasa, (2) motivasi kerja, (3) kesesuaian karakter, dan (4) pemahaman tentang budaya kerja Jepang."
            : "The interview with the Japanese company usually lasts 15–30 minutes in Japanese (N4–N3 level). The interviewer assesses: (1) language ability, (2) work motivation, (3) character fit, and (4) understanding of Japanese work culture."}
        </p>
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm mb-3">
            {isId ? "Pertanyaan Umum yang Muncul" : "Common Questions Asked"}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Circle className="w-1.5 h-1.5 text-violet-600 mt-1.5 shrink-0" />
              <span>{isId ? "自己紹介をお願いします — Perkenalkan diri Anda." : "自己紹介をお願いします — Please introduce yourself."}</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-1.5 h-1.5 text-violet-600 mt-1.5 shrink-0" />
              <span>{isId ? "なぜ日本で働きたいですか — Mengapa ingin bekerja di Jepang?" : "なぜ日本で働きたいですか — Why do you want to work in Japan?"}</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-1.5 h-1.5 text-violet-600 mt-1.5 shrink-0" />
              <span>{isId ? "日本の仕事についてどう思いますか — Apa pendapat Anda tentang kerja di Jepang?" : "日本の仕事についてどう思いますか — What do you think about working in Japan?"}</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-1.5 h-1.5 text-violet-600 mt-1.5 shrink-0" />
              <span>{isId ? "日本語はどのぐらい勉強しましたか — Sudah berapa lama belajar bahasa Jepang?" : "日本語はどのぐらい勉強しましたか — How long have you studied Japanese?"}</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-1.5 h-1.5 text-violet-600 mt-1.5 shrink-0" />
              <span>{isId ? "残業は大丈夫ですか — Apakah Anda bisa lembur?" : "残業は大丈夫ですか — Are you okay with overtime?"}</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-1.5 h-1.5 text-violet-600 mt-1.5 shrink-0" />
              <span>{isId ? "家族はどう思いますか — Bagaimana keluarga Anda menyikapi keputusan ini?" : "家族はどう思いますか — What does your family think about this decision?"}</span>
            </li>
          </ul>
        </div>

        {/* 8. Latih */}
        <SectionHeading id="latih">
          {isId ? "Latih Wawancara dengan AI" : "Practice Interview with AI"}
        </SectionHeading>
        <p className="text-muted-foreground leading-relaxed">
          {isId
            ? "Nihongolive memiliki simulator wawancara AI yang dirancang khusus untuk persiapan Tokutei Ginou. Kami menyediakan skenario interview sesuai sektor: Kaigo, Perhotelan, Restoran, Manufaktur, Konstruksi, dan umum Tokutei Ginou."
            : "Nihongolive has an AI interview simulator designed specifically for SSW preparation. We provide interview scenarios tailored to each sector: Elderly Care, Hotel, Restaurant, Manufacturing, Construction, and general SSW."}
        </p>
        <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 dark:bg-violet-900/20 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-violet-900 dark:text-violet-100">
              {isId ? "Coba Simulasi Wawancara Sekarang" : "Try the Interview Simulation Now"}
            </h3>
            <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
              {isId
                ? "Gratis 3 putaran per skenario. Latih jawaban dalam bahasa Jepang, terima feedback real-time dari AI."
                : "Free 3 rounds per scenario. Practice answers in Japanese and get real-time AI feedback."}
            </p>
          </div>
          <Link
            to="/interview/iv_tokutei_ginou"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-violet-700 transition"
          >
            <MessageCircle className="w-4 h-4" />
            {isId ? "Latih Wawancara SSW" : "Practice SSW Interview"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { id: "iv_kaigo", label: "Kaigo" },
            { id: "iv_hotel", label: "Hotel" },
            { id: "iv_restaurant_staff", label: "Restoran" },
            { id: "iv_tokutei_ginou", label: "Tokutei Ginou Umum" },
          ].map((s) => (
            <Link
              key={s.id}
              to={`/interview/${s.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 transition"
            >
              <Briefcase className="w-3 h-3 text-muted-foreground" />
              {s.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center">
          <h3 className="font-bold text-lg">
            {isId ? "Mulai Belajar Bahasa Jepang dari Nol" : "Start Learning Japanese from Zero"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
            {isId
              ? "Kurikulum Nihongolive mencakup Hiragana, Katakana, N5, dan N4 — dasar yang kamu butuhkan untuk lolos ujian dan wawancara SSW."
              : "The Nihongolive curriculum covers Hiragana, Katakana, N5, and N4 — the foundations you need to pass the SSW exam and interview."}
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              <BookOpen className="w-4 h-4" />
              {isId ? "Mulai Belajar Gratis" : "Start Learning Free"}
            </Link>
            <Link
              to="/interview"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-medium hover:bg-muted transition"
            >
              <Briefcase className="w-4 h-4" />
              {isId ? "Lihat Semua Skenario" : "View All Scenarios"}
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
