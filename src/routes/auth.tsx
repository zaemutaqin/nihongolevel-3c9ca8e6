import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AlertCircle, Loader2, Mail, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Masuk — NihongoLevel" },
      { name: "description", content: "Masuk atau daftar untuk menyimpan progress interview & translator NihongoLevel." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, lang } = useT();
  const { user, loading } = useAuth();
  const { redirect, mode: initialMode } = useSearch({ from: "/auth" });
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Redirect away if already signed in
  useEffect(() => {
    if (!loading && user) {
      const target = redirect && redirect.startsWith("/") ? redirect : "/";
      navigate({ to: target, replace: true });
    }
  }, [user, loading, redirect, navigate]);

  const isId = lang === "id";
  const labels = {
    signinTitle: isId ? "Masuk ke NihongoLevel" : "Sign in to NihongoLevel",
    signupTitle: isId ? "Buat akun NihongoLevel" : "Create your NihongoLevel account",
    subtitle: isId
      ? "Simpan progress interview & riwayat translator."
      : "Save your interview progress and translator history.",
    google: isId ? "Lanjutkan dengan Google" : "Continue with Google",
    or: isId ? "atau dengan email" : "or with email",
    email: "Email",
    password: isId ? "Kata sandi" : "Password",
    signinBtn: isId ? "Masuk" : "Sign in",
    signupBtn: isId ? "Daftar" : "Sign up",
    toSignup: isId ? "Belum punya akun? Daftar" : "Don't have an account? Sign up",
    toSignin: isId ? "Sudah punya akun? Masuk" : "Already have an account? Sign in",
    back: isId ? "Kembali" : "Back",
    minPw: isId ? "Kata sandi minimal 6 karakter." : "Password must be at least 6 characters.",
    confirmSent: isId
      ? "Cek email kamu untuk konfirmasi pendaftaran."
      : "Check your inbox to confirm your sign-up.",
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + (redirect ?? "/"),
      });
      if (r.error) {
        setError(r.error.message || (isId ? "Gagal masuk dengan Google." : "Google sign-in failed."));
        setGoogleLoading(false);
      }
    } catch (e) {
      setError((e as Error).message);
      setGoogleLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 6) {
      setError(labels.minPw);
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + (redirect ?? "/") },
        });
        if (err) throw err;
        // If email confirmation is required, session will be null
        if (!data.session) {
          setInfo(labels.confirmSent);
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> {labels.back}
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signin" ? labels.signinTitle : labels.signupTitle}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{labels.subtitle}</p>

          <button
            onClick={handleGoogle}
            disabled={googleLoading || submitting}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60 transition"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
            )}
            {labels.google}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>{labels.or}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">{labels.email}</span>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">{labels.password}</span>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  placeholder="••••••••"
                />
              </div>
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            {info && (
              <div className="flex items-start gap-2 rounded-lg border border-green-500/40 bg-green-500/5 p-3 text-xs text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{info}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || googleLoading}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition",
              )}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? labels.signinBtn : labels.signupBtn}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setInfo(null);
              setMode(mode === "signin" ? "signup" : "signin");
            }}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition"
          >
            {mode === "signin" ? labels.toSignup : labels.toSignin}
          </button>
        </div>
      </div>
    </div>
  );
}
