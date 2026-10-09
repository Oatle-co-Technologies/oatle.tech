"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { authClient } from "@/lib/auth/client";

type StaffInfo = {
  id: number;
  name: string;
  email: string;
  access_level: string;
  active: boolean;
  is_owner: boolean;
};

type AuthContextValue = {
  userEmail: string;
  staff: StaffInfo | null;
  loading: boolean;
  authorizationError: string;
  updateStaffName: (name: string) => void;
};

const AuthContext = createContext<AuthContextValue>({
  userEmail: "",
  staff: null,
  loading: true,
  authorizationError: "",
  updateStaffName: () => {},
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userEmail, setUserEmail] = useState("");
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorizationError, setAuthorizationError] = useState("");

  useEffect(() => {
    let stopped = false;
    let generation = 0;
    async function loadSession() {
      const current = ++generation;
      setLoading(true);
      setAuthorizationError("");
      try {
        const result = process.env.NEXT_PUBLIC_AUTH_PROVIDER === "supabase"
          ? await createClient().auth.getUser()
          : await authClient.getSession();
        if (stopped || current !== generation) return;
        const sessionData = result.data as {
          user?: { email?: string | null };
          session?: { user?: { email?: string | null } };
        } | null;

        const email =
          (
            sessionData?.user?.email ||
            sessionData?.session?.user?.email
          )?.toLowerCase().trim() || "";

        setUserEmail(email);

        if (!email) {
          setStaff(null);
          setLoading(false);
          return;
        }

        const response = await fetch(
          "/api/backend/auth/me"
        );

        if (stopped || current !== generation) return;
        if (response.ok) {
          const data: StaffInfo = await response.json();
          setStaff(data);
        } else {
          const data = await response.json().catch(() => null);
          const detail =
            typeof data?.detail === "string"
              ? data.detail
              : `Authorization request failed (${response.status})`;
          setAuthorizationError(detail);
          console.error(
            "Dashboard authorization failed:",
            detail
          );
          setStaff(null);
        }
      } catch {
        if (!stopped && current === generation) setStaff(null);
      } finally {
        if (!stopped && current === generation) setLoading(false);
      }
    }

    void loadSession();
    if (process.env.NEXT_PUBLIC_AUTH_PROVIDER !== "supabase") return () => { stopped = true; };
    // Do not await Supabase calls inside its auth callback; schedule outside its lock.
    const { data: { subscription } } = createClient().auth.onAuthStateChange(() => {
      window.setTimeout(() => { if (!stopped) void loadSession(); }, 0);
    });
    const resume = () => { if (document.visibilityState === "visible") void loadSession(); };
    document.addEventListener("visibilitychange", resume);
    return () => { stopped = true; subscription.unsubscribe(); document.removeEventListener("visibilitychange", resume); };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userEmail,
        staff,
        loading,
        authorizationError,
        updateStaffName: (name) =>
          setStaff((current) => current ? { ...current, name } : current),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}