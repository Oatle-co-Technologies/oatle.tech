"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { authClient } from "@/lib/auth/client";

type StaffInfo = {
  id: number;
  name: string;
  email: string;
  access_level: string;
  active: boolean;
};

type AuthContextValue = {
  userEmail: string;
  staff: StaffInfo | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  userEmail: "",
  staff: null,
  loading: true,
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userEmail, setUserEmail] = useState("");
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const result = await authClient.getSession();

        const email =
          result.data?.user?.email?.toLowerCase().trim() || "";

        setUserEmail(email);

        if (!email) {
          setStaff(null);
          setLoading(false);
          return;
        }

        const response = await fetch(
          "/api/backend/auth/me"
        );

        if (response.ok) {
          const data: StaffInfo = await response.json();
          setStaff(data);
        } else {
          setStaff(null);
        }
      } catch {
        setStaff(null);
      } finally {
        setLoading(false);
      }
    }

    void loadSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userEmail,
        staff,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}