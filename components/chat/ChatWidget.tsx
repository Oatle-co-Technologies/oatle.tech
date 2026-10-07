"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import styles from "./ChatWidget.module.css";

type Message = { role: "user" | "assistant"; text: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const conversation = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    if (conversation.current) {
      conversation.current.scrollTop = conversation.current.scrollHeight;
    }
  }, [messages, sending, open]);

  function close() {
    setOpen(false);
    launcher.current?.focus();
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setError("");

    try {
      // Only the current question goes to the public backend, never a key.
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({ message }),
        signal: AbortSignal.timeout(35000),
      });
      if (!response.ok) {
        throw new Error(response.status === 429
          ? "Chat is busy. Please try again in a moment."
          : "Chat is unavailable right now. Please try again or contact us.");
      }
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("reply" in data)
          || typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("We couldn't get a reply. Please try again.");
      }
      setMessages((previous) => [...previous,
        { role: "user", text: message },
        { role: "assistant", text: data.reply as string },
      ]);
      setDraft("");
    } catch (failure) {
      setError(failure instanceof Error && failure.name === "Error"
        ? failure.message : "We couldn't connect. Please try again or contact us.");
    } finally {
      inFlight.current = false;
      setSending(false);
      input.current?.focus();
    }
  }

  return (
    <div className={styles.widget}>
      {open && (
        <section id="oatle-chat" className={styles.panel}
          aria-labelledby="oatle-chat-title"
          onKeyDown={(event) => { if (event.key === "Escape") close(); }}>
          <header className={styles.header}>
            <div><h2 id="oatle-chat-title">Chat with Oatle</h2><p>AI website assistant</p></div>
            <button type="button" onClick={close} aria-label="Close chat" className={styles.close}>
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div ref={conversation} className={styles.messages} role="log"
            aria-label="Chat messages" aria-live="polite" tabIndex={0}>
            <div className={styles.assistant}>
              Hi! Ask me about websites or digital solutions. For a quote or a booking,
              <a href="/contact"> contact our team</a>.
            </div>
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? styles.user : styles.assistant}>
                <span className={styles.label}>{message.role === "user" ? "You" : "Oatle AI"}</span>
                {message.text}
              </div>
            ))}
            {sending && <div className={styles.assistant}>Thinking…</div>}
          </div>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <form onSubmit={send} className={styles.form} aria-busy={sending}>
            <label htmlFor="oatle-chat-message" className={styles.srOnly}>Your message</label>
            <input ref={input} id="oatle-chat-message" value={draft}
              onChange={(event) => setDraft(event.target.value)} maxLength={4000}
              placeholder="Ask a question…" readOnly={sending} autoComplete="off" />
            <button type="submit" disabled={sending || !draft.trim()} aria-label="Send message">
              <Send size={19} aria-hidden="true" />
            </button>
          </form>
          <p className={styles.note}>AI can make mistakes. Each question is answered independently.</p>
        </section>
      )}
      <button ref={launcher} type="button" className={styles.launcher}
        aria-expanded={open} aria-controls="oatle-chat"
        onClick={() => { if (open) close(); else setOpen(true); }}>
        <MessageCircle size={22} aria-hidden="true" /> {open ? "Close chat" : "Chat with us"}
      </button>
    </div>
  );
}
