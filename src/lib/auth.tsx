import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { syncOnLogin } from "./cloud-sync";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_pro: boolean;
}

interface AuthCtx {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id,email,full_name,avatar_url,is_pro")
      .eq("id", uid)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  };

  useEffect(() => {
    let mounted = true;
    let syncedFor: string | null = null;

    // 1) Synchronous-ish listener first
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Defer Supabase calls out of the auth callback to avoid deadlocks
        setTimeout(async () => {
          await loadProfile(u.id);
          if (syncedFor !== u.id) {
            syncedFor = u.id;
            try { await syncOnLogin(u.id); } catch (e) { console.warn("sync failed", e); }
            await loadProfile(u.id);
          }
        }, 0);
      } else {
        setProfile(null);
      }
      if (event === "INITIAL_SESSION") setLoading(false);
    });

    // 2) Then check existing session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUser(u);
      setLoading(false);
      if (u) {
        loadProfile(u.id);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <Ctx.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
