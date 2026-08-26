"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
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
  const userEmailRef = useRef(userEmail);

  useEffect(() => {
    userEmailRef.current = userEmail;
  }, [userEmail]);

  useEffect(() => {
    async function loadSession() {
      try {
        const result = await authClient.getSession();
        const email =
          result.data?.user?.email?.toLowerCase().trim() || "";

        setUserEmail(email);

        if (!email) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          "/api/backend/auth/me",
          {
            headers: {
              "X-User-Email": email,
            },
          }
        );

        if (response.ok) {
          const data: StaffInfo =
            await response.json();

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

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (
      input: RequestInfo | URL,
      init: RequestInit = {}
    ) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url.includes("/api/backend/")) {
        const existingHeader = (
          init.headers as
            | Record<string, string>
            | undefined
        )?.["X-User-Email"];

        if (!existingHeader) {
          init = {
            ...init,
            headers: {
              ...(init.headers as
                | Record<string, string>
                | undefined),
              "X-User-Email": userEmailRef.current,
            },
          };
        }
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
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
