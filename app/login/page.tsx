"use client";
import { AuthView } from "@neondatabase/auth-ui";
import LoginScreen from "@/components/auth/EmailCodeLogin";
export default function LoginPage() {
  return process.env.NEXT_PUBLIC_AUTH_PROVIDER === "supabase" ? <LoginScreen preview={false} /> : <main><AuthView path="sign-in" /></main>;
}
