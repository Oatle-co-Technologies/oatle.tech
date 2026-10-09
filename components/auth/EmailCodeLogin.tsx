"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import styles from "@/app/login/preview/login.module.css";

export default function LoginScreen({ preview = true }: { preview?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  async function sendCode() {
    const { error } = await createClient().auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: false } });
    if (error) throw new Error(error.status === 429 ? "Please wait a moment before requesting another code." : "Unable to send a code. Please try again.");
    setResendAt(Date.now() + 60_000);
    setStep("code");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setMessage("");
    if (preview) {
      if (step === "email") setStep("code");
      else setMessage("The design is ready. Code verification will be connected next.");
      return;
    }
    setBusy(true);
    try {
      if (step === "email") await sendCode();
      else {
        const { error } = await createClient().auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: "email" });
        if (error) throw new Error("That code is invalid or has expired. Request a new code and try again.");
        setCode("");
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    } finally { setBusy(false); }
  }

  async function resend() {
    if (busy) return;
    if (Date.now() < resendAt) { setMessage("Please wait 60 seconds between code requests."); return; }
    setBusy(true); setMessage("");
    try { await sendCode(); setMessage("If your account is registered, a new code is on its way."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to resend your code."); }
    finally { setBusy(false); }
  }

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>← Back to Oatle</Link>
      <section className={styles.card} aria-labelledby="login-title">
        <Link href="/" aria-label="Oatle Technologies home" className={styles.logo}>
          <Image src="/oatle-technologies-transparent-logo.png" alt="Oatle Technologies" width={220} height={150} priority style={{ width: "190px", height: "auto" }} />
        </Link>
        <span className={styles.eyebrow}>YOUR OATLE WORKSPACE</span>
        <h1 id="login-title">{step === "email" ? "Welcome back." : "Check your inbox."}</h1>
        <p className={styles.intro}>
          {step === "email" ? "Sign in to manage your projects and keep things moving." : <>Enter the login code sent to <strong>{email}</strong>.</>}
        </p>
        <form onSubmit={submit} className={styles.form}>
          {step === "email" ? (
            <div>
              <label htmlFor="login-email">Email address</label>
              <input id="login-email" type="email" autoComplete="email" placeholder="you@oatle-technologies.co.za" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} />
            </div>
          ) : (
            <div>
              <label htmlFor="login-code">Login code</label>
              <input key="code" id="login-code" className={styles.code} type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="Enter your code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} pattern="[0-9]{6,10}" maxLength={10} required disabled={busy} autoFocus />
              <p className={styles.hint}>Use the newest code in your inbox. Keep it private.</p>
            </div>
          )}
          <button className={styles.primary} type="submit" disabled={busy}>{busy ? "Please wait…" : step === "email" ? "Send login code" : "Sign in"}<span aria-hidden="true">→</span></button>
          {step === "code" && <button type="button" className={styles.secondary} disabled={busy} onClick={() => { setStep("email"); setCode(""); setMessage(""); }}>Use a different email</button>}
          {step === "code" && !preview && <button type="button" className={styles.secondary} disabled={busy} onClick={() => void resend()}>Send a new code</button>}
          {message && <p className={styles.message} role="status">{message}</p>}
        </form>
        <p className={styles.note}>A secure code. No password to remember.</p>
      </section>
      {preview && <p className={styles.preview}>Design preview · Emails and sign-in are not connected yet.</p>}
      <footer className={styles.footer}>Oatle Technologies <span>Grow. Multiply. Succeed.</span></footer>
    </main>
  );
}
