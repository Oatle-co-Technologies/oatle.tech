"use client";

import { AuthView } from "@neondatabase/auth-ui";

export default function LoginPage() {
  return (
    <main>
      <AuthView
        path="sign-in"
        />
    </main>
  );
}