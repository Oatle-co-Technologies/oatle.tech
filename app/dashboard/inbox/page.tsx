"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import "./inbox.css";

type MailSummary = { uid: number; subject: string; sender: string; date: string; unread: boolean };
type Inbox = { address: string; total: number; unread: number; uid_validity: number; messages: MailSummary[]; next_before: number | null };
type Message = MailSummary & { to: string; reply_to: string; body: string; truncated: boolean; attachments: string[] };

async function read<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Your inbox could not be loaded.");
  return data;
}

export default function InboxPage() {
  const { staff } = useAuth();
  return staff ? <InboxContent key={staff.id} /> : null;
}

function InboxContent() {
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [before, setBefore] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ recipient: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sentNotice, setSentNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    read<Inbox>(`/api/backend/mail/inbox${before ? `?before=${before}` : ""}`, controller.signal)
      .then(setInbox).catch(err => { if (!controller.signal.aborted) { setInbox(null); setError(err.message); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [before, revision]);

  useEffect(() => {
    if (selected === null || !inbox) return;
    const controller = new AbortController();
    read<Message>(`/api/backend/mail/inbox/${selected}?uid_validity=${inbox.uid_validity}`, controller.signal)
      .then(setMessage).catch(err => { if (!controller.signal.aborted) setMessageError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setMessageLoading(false); });
    return () => controller.abort();
  }, [selected, inbox]);

  function loadPage(nextBefore: number | null) {
    setLoading(true); setError(""); setMessage(null); setSelected(null); setMessageError("");
    setBefore(nextBefore); setRevision(r => r + 1);
  }

  function openMessage(uid: number) {
    if (selected === uid) return;
    setMessageLoading(true); setMessage(null); setMessageError(""); setSelected(uid);
  }

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true); setSendError(""); setSentNotice("");
    try {
      const response = await fetch("/api/backend/mail/send", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.detail === "string" ? result.detail : "Email could not be sent.");
      setSentNotice(result.sent_copy_saved ? "Email sent. A copy is saved in your Sent folder." : "Email sent. A copy could not be saved in your Sent folder.");
      setDraft({ recipient: "", subject: "", body: "" }); setComposing(false);
    } catch (err) { setSendError(err instanceof Error ? err.message : "Delivery could not be confirmed. Check Purelymail before sending again."); }
    finally { setSending(false); }
  }

  function compose(reply?: Message) {
    setDraft({ recipient: reply?.reply_to || "", subject: reply ? (reply.subject.toLowerCase().startsWith("re:") ? reply.subject : `Re: ${reply.subject}`) : "", body: "" });
    setSendError(""); setSentNotice(""); setComposing(true);
  }

  return <main className="mail-workspace">
    <Link className="dashboard-link" href="/dashboard">← Back to Dashboard</Link>
    <header className="dashboard-header"><div><p className="dashboard-eyebrow">OATLE TECHNOLOGIES</p><h1>Inbox</h1><p className="dashboard-subtitle">{inbox?.address || "Your email inbox"}</p></div>
      <button className="dashboard-button" type="button" disabled={loading} onClick={() => loadPage(null)}>Refresh</button></header>
    {error && <p className="dashboard-form-error" role="alert">{error}</p>}
    {sentNotice && <p role="status">{sentNotice}</p>}
    {inbox && !loading && <>
      <div className="dashboard-stats mail-stats"><div className="dashboard-card"><p>Inbox messages</p><h2>{inbox.total}</h2></div><div className="dashboard-card"><p>Unread</p><h2>{inbox.unread}</h2></div></div>
      <button type="button" className="dashboard-button dashboard-button-primary" disabled={sending} onClick={() => compose()}>Compose email</button>
    </>}
    {composing && <form className="dashboard-panel mail-compose" onSubmit={send}>
      <h2>New email</h2><p className="dashboard-subtitle">From: {inbox?.address}</p>
      <label>To<input type="email" required autoComplete="email" value={draft.recipient} disabled={sending} onChange={e => setDraft({ ...draft, recipient: e.target.value })}/></label>
      <label>Subject<input required maxLength={200} value={draft.subject} disabled={sending} onChange={e => setDraft({ ...draft, subject: e.target.value })}/></label>
      <label>Message<textarea required maxLength={100000} rows={8} value={draft.body} disabled={sending} onChange={e => setDraft({ ...draft, body: e.target.value })}/></label>
      {sendError && <p role="alert">{sendError}</p>}
      <button type="submit" className="dashboard-button dashboard-button-primary" disabled={sending}>{sending ? "Sending…" : "Send email"}</button>{" "}
      <button type="button" className="dashboard-button" disabled={sending} onClick={() => setComposing(false)}>Cancel</button>
    </form>}
    {loading ? <p role="status">Loading your inbox…</p> : inbox && <div className="mail-columns">
      <section className="dashboard-panel mail-list" aria-label="Inbox messages">
        {!inbox.messages.length && <p className="dashboard-empty">No messages in your inbox.</p>}
        {inbox.messages.map(item => <button type="button" className="mail-row" key={item.uid} aria-pressed={selected === item.uid} onClick={() => openMessage(item.uid)}>
          <span className="mail-sender">{item.sender}</span><span className="mail-subject">{item.unread && <span aria-label="Unread">● </span>}{item.subject}</span><span className="mail-date">{item.date}</span>
        </button>)}
        <div className="mail-pagination">{before && <button type="button" className="dashboard-button" onClick={() => loadPage(null)}>Newest messages</button>}{inbox.next_before && <button type="button" className="dashboard-button" onClick={() => loadPage(inbox.next_before)}>Older messages</button>}</div>
      </section>
      <section className="dashboard-panel mail-detail" aria-label="Selected email" aria-live="polite">
        {messageLoading ? <p role="status">Opening email…</p> : messageError ? <p role="alert">{messageError}</p> : message ? <>
          <h2>{message.subject}</h2><p className="dashboard-subtitle">From: {message.sender}<br/>To: {message.to}<br/>{message.date}</p>
          <button type="button" className="dashboard-button" disabled={sending} onClick={() => compose(message)}>Reply</button>
          <div className="mail-body">{message.body || "This message has no readable text."}</div>
          {message.truncated && <p className="dashboard-subtitle">This large message is partially displayed.</p>}
          {!!message.attachments.length && <p className="dashboard-subtitle">Attachments: {message.attachments.join(", ")} (view in Purelymail)</p>}
        </> : <p className="dashboard-empty">Select an email to read it.</p>}
      </section>
    </div>}
  </main>;
}
