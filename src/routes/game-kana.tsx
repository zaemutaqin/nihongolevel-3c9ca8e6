import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Play, RotateCw, Trophy } from "lucide-react";
import { useT } from "@/lib/i18n";
import { HanashiteTeaserBanner } from "@/components/HanashiteTeaserBanner";

export const Route = createFileRoute("/game-kana")({
  head: () => ({
    meta: [
      { title: "Kana Speed Drop — Game Belajar Hiragana | NihongoLevel" },
      {
        name: "description",
        content:
          "Mini-game seru untuk menghafal Hiragana. Ketik romaji sebelum huruf jatuh ke dasar layar. Kejar high score dan kuasai 71+ huruf Jepang!",
      },
      { property: "og:title", content: "Kana Speed Drop — Game Hiragana" },
      {
        property: "og:description",
        content: "Hafalkan Hiragana lewat mini-game ketik-cepat. Bisa dimainkan langsung di browser.",
      },
    ],
    links: [{ rel: "canonical", href: "/game-kana" }],
  }),
  component: KanaDropGame,
});

// 46 Gojuuon dasar
const KANA: { jp: string; r: string }[] = [
  { jp: "あ", r: "a" }, { jp: "い", r: "i" }, { jp: "う", r: "u" }, { jp: "え", r: "e" }, { jp: "お", r: "o" },
  { jp: "か", r: "ka" }, { jp: "き", r: "ki" }, { jp: "く", r: "ku" }, { jp: "け", r: "ke" }, { jp: "こ", r: "ko" },
  { jp: "さ", r: "sa" }, { jp: "し", r: "shi" }, { jp: "す", r: "su" }, { jp: "せ", r: "se" }, { jp: "そ", r: "so" },
  { jp: "た", r: "ta" }, { jp: "ち", r: "chi" }, { jp: "つ", r: "tsu" }, { jp: "て", r: "te" }, { jp: "と", r: "to" },
  { jp: "な", r: "na" }, { jp: "に", r: "ni" }, { jp: "ぬ", r: "nu" }, { jp: "ね", r: "ne" }, { jp: "の", r: "no" },
  { jp: "は", r: "ha" }, { jp: "ひ", r: "hi" }, { jp: "ふ", r: "fu" }, { jp: "へ", r: "he" }, { jp: "ほ", r: "ho" },
  { jp: "ま", r: "ma" }, { jp: "み", r: "mi" }, { jp: "む", r: "mu" }, { jp: "め", r: "me" }, { jp: "も", r: "mo" },
  { jp: "や", r: "ya" }, { jp: "ゆ", r: "yu" }, { jp: "よ", r: "yo" },
  { jp: "ら", r: "ra" }, { jp: "り", r: "ri" }, { jp: "る", r: "ru" }, { jp: "れ", r: "re" }, { jp: "ろ", r: "ro" },
  { jp: "わ", r: "wa" }, { jp: "を", r: "wo" }, { jp: "ん", r: "n" },
];

type Drop = { id: number; jp: string; r: string; x: number; y: number; speed: number };

const HS_KEY = "kana_drop_highscore_v1";

function KanaDropGame() {
  const { lang } = useT();
  const isId = lang === "id";

  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [input, setInput] = useState("");
  const [drops, setDrops] = useState<Drop[]>([]);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropsRef = useRef<Drop[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const lastSpawnRef = useRef(0);
  const lastFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const idCounterRef = useRef(1);

  useEffect(() => {
    const hs = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
    setHighScore(isNaN(hs) ? 0 : hs);
  }, []);

  useEffect(() => {
    dropsRef.current = drops;
  }, [drops]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  const stopGame = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setRunning(false);
    setGameOver(true);
    setHighScore((prev) => {
      const next = Math.max(prev, scoreRef.current);
      if (next !== prev) localStorage.setItem(HS_KEY, String(next));
      return next;
    });
  }, []);

  const tick = useCallback(
    (ts: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = ts;
      const dt = (ts - lastFrameRef.current) / 1000;
      lastFrameRef.current = ts;

      // Spawn rate scales with score
      const interval = Math.max(700, 1600 - scoreRef.current * 25);
      if (ts - lastSpawnRef.current > interval) {
        lastSpawnRef.current = ts;
        const k = KANA[Math.floor(Math.random() * KANA.length)];
        const newDrop: Drop = {
          id: idCounterRef.current++,
          jp: k.jp,
          r: k.r,
          x: 8 + Math.random() * 84,
          y: 0,
          speed: 20 + Math.min(40, scoreRef.current * 0.6),
        };
        dropsRef.current = [...dropsRef.current, newDrop];
      }

      // Move drops
      const updated: Drop[] = [];
      let lost = 0;
      for (const d of dropsRef.current) {
        const ny = d.y + d.speed * dt;
        if (ny >= 100) {
          lost += 1;
        } else {
          updated.push({ ...d, y: ny });
        }
      }
      dropsRef.current = updated;
      setDrops(updated);

      if (lost > 0) {
        const newLives = livesRef.current - lost;
        livesRef.current = newLives;
        setLives(newLives);
        if (newLives <= 0) {
          stopGame();
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [stopGame],
  );

  const startGame = () => {
    setScore(0);
    setLives(3);
    setDrops([]);
    setInput("");
    setGameOver(false);
    dropsRef.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    lastSpawnRef.current = 0;
    lastFrameRef.current = 0;
    idCounterRef.current = 1;
    setRunning(true);
    setTimeout(() => inputRef.current?.focus(), 50);
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toLowerCase().replace(/\s/g, "");
    setInput(v);
    if (!v) return;
    // Check matches: lowest (largest y) first
    const sorted = [...dropsRef.current].sort((a, b) => b.y - a.y);
    const hit = sorted.find((d) => d.r === v);
    if (hit) {
      const remaining = dropsRef.current.filter((d) => d.id !== hit.id);
      dropsRef.current = remaining;
      setDrops(remaining);
      setScore((s) => s + 1);
      setInput("");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {isId ? "Kana Speed Drop" : "Kana Speed Drop"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isId
            ? "Ketik romaji-nya sebelum huruf Hiragana menyentuh dasar. 3 huruf lolos = game over."
            : "Type the romaji before the Hiragana hits the bottom. 3 misses and it's over."}
        </p>
      </header>

      <div className="flex items-center justify-between gap-3 mb-3 text-sm">
        <div className="flex items-center gap-4">
          <span className="font-semibold">
            {isId ? "Skor" : "Score"}: <span className="text-primary">{score}</span>
          </span>
          <span>
            {isId ? "Nyawa" : "Lives"}: {"❤".repeat(Math.max(0, lives))}
            <span className="text-muted-foreground">{"♡".repeat(Math.max(0, 3 - lives))}</span>
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Trophy className="w-3.5 h-3.5" /> High: {highScore}
        </span>
      </div>

      <div
        className="relative w-full rounded-2xl border-2 border-border bg-gradient-to-b from-background to-muted/40 overflow-hidden"
        style={{ aspectRatio: "3 / 4", maxHeight: "560px" }}
      >
        {drops.map((d) => (
          <div
            key={d.id}
            className="absolute text-3xl sm:text-4xl font-bold text-foreground select-none"
            style={{ left: `${d.x}%`, top: `${d.y}%`, transform: "translateX(-50%)" }}
          >
            {d.jp}
          </div>
        ))}

        {/* Danger zone */}
        <div className="absolute bottom-0 inset-x-0 h-3 bg-destructive/30" />

        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
            {gameOver && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{isId ? "Game Over" : "Game Over"}</p>
                <p className="text-3xl font-bold mt-1">{score}</p>
                {score >= highScore && score > 0 && (
                  <p className="text-xs text-primary mt-1 font-semibold">
                    🏆 {isId ? "Rekor baru!" : "New high score!"}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={startGame}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
            >
              {gameOver ? <RotateCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {gameOver ? (isId ? "Main Lagi" : "Play Again") : (isId ? "Mulai" : "Start")}
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        value={input}
        onChange={handleInput}
        disabled={!running}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={isId ? "Ketik romaji di sini..." : "Type romaji here..."}
        className="mt-4 w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-lg font-mono text-center outline-none focus:border-primary disabled:opacity-50"
      />

      {gameOver && score > 0 && (
        <div className="mt-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">
                {isId
                  ? "Sudah hafal hurufnya? Sekarang waktunya bicara!"
                  : "Got the letters? Time to actually speak!"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isId
                  ? "Latih percakapan nyata dengan AI di Hanashite Room. Gratis 1 skenario."
                  : "Practice real conversations with AI in Hanashite Room. 1 free scenario."}
              </p>
              <Link
                to="/"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
              >
                {isId ? "Coba Hanashite Room" : "Try Hanashite Room"}
              </Link>
            </div>
          </div>
        </div>
      )}

      <HanashiteTeaserBanner />
    </div>
  );
}
