"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import "./inbox.css";

type MailSummary = { uid: number; subject: string; sender: string; to: string; date: string; unread: boolean };
type Inbox = { address: string; total: number; unread: number; uid_validity: number; messages: MailSummary[]; next_before: number | null };
type Message = MailSummary & { to: string; reply_to: string; body: string; html_body?: string | null; truncated: boolean; attachments: string[] };

async function read<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Your inbox could not be loaded.");
  return data;
}

type View = "inbox" | "unread" | "sent";
type ScreenProps = { initialView: View; initialBefore: number | null; messageUid?: number; validity?: number };

export default function MailScreen(props: ScreenProps) {
  const { staff } = useAuth();
  return staff ? <InboxContent key={`${staff.id}-${props.messageUid ?? "list"}-${props.initialView}-${props.initialBefore}`} {...props} address={staff.email} /> : null;
}

function InboxContent({ initialView: view, initialBefore: before, messageUid, validity, address }: ScreenProps & { address: string }) {
  const router = useRouter();
  const listUrl = `/dashboard/inbox?view=${view}${before ? `&before=${before}` : ""}`;
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(Boolean(messageUid));
  const [error, setError] = useState("");
  const [readStatusError, setReadStatusError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ recipient: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sentNotice, setSentNotice] = useState("");

  useEffect(() => {
    if (messageUid) return;
    const controller = new AbortController();
    read<Inbox>(`/api/backend/mail/inbox?view=${view}${before ? `&before=${before}` : ""}`, controller.signal)
      .then(setInbox).catch(err => { if (!controller.signal.aborted) { setInbox(null); setError(err.message); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [before, revision, view, messageUid]);

  useEffect(() => {
    if (!messageUid || !validity) return;
    const controller = new AbortController();
    read<Message>(`/api/backend/mail/inbox/${messageUid}?uid_validity=${validity}&view=${view}`, controller.signal)
      .then(async data => {
        if (controller.signal.aborted) return;
        setMessage(data);
        try {
          const response = await fetch(`/api/backend/mail/inbox/${messageUid}/read?uid_validity=${validity}&view=${view}`, { method: "POST", signal: controller.signal });
          if (!response.ok) throw new Error("Email opened, but its read status could not be updated. Reopen it to try again.");
        } catch (err) { if (!controller.signal.aborted) setReadStatusError(err instanceof Error ? err.message : "Read status could not be updated."); }
      }).catch(err => { if (!controller.signal.aborted) setMessageError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setMessageLoading(false); });
    return () => controller.abort();
  }, [messageUid, validity, view]);

  function loadPage(nextBefore: number | null) {
    if (nextBefore !== before) {
      router.push(`/dashboard/inbox?view=${view}${nextBefore ? `&before=${nextBefore}` : ""}`);
      return;
    }
    setLoading(true); setError(""); setRevision(r => r + 1);
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

  const composeForm = composing && <form className="dashboard-panel mail-compose" onSubmit={send}>
      <h2>New email</h2><p className="dashboard-subtitle">Emails use your Oatle branded template.</p><p className="dashboard-subtitle">From: {inbox?.address || address}</p>
      <label>To<input type="email" required autoComplete="email" value={draft.recipient} disabled={sending} onChange={e => setDraft({ ...draft, recipient: e.target.value })}/></label>
      <label>Subject<input required maxLength={200} value={draft.subject} disabled={sending} onChange={e => setDraft({ ...draft, subject: e.target.value })}/></label>
      <label>Message<textarea required maxLength={100000} rows={8} value={draft.body} disabled={sending} onChange={e => setDraft({ ...draft, body: e.target.value })}/></label>
      {sendError && <p role="alert">{sendError}</p>}
      <button type="submit" className="dashboard-button dashboard-button-primary" disabled={sending}>{sending ? "Sending…" : "Send email"}</button>{" "}
      <button type="button" className="dashboard-button" disabled={sending} onClick={() => setComposing(false)}>Cancel</button>
    </form>;

  if (messageUid) return <main className="mail-workspace mail-message-page">
    <Link className="dashboard-link" href={listUrl}>← Back to {view === "sent" ? "Sent" : view === "unread" ? "Unread" : "Inbox"}</Link>
    {sentNotice && <p role="status">{sentNotice}</p>}
    {composeForm}
    {!validity ? <p role="alert">Open this email from your message list.</p> : messageLoading ? <p role="status">Opening email…</p> : messageError ? <p role="alert">{messageError}</p> : message && <article className="dashboard-panel mail-detail" aria-label="Email message">
      <h1>{message.subject}</h1><p className="dashboard-subtitle">From: {message.sender}<br/>To: {message.to}<br/>{message.date}</p>
      {view !== "sent" && <button type="button" className="dashboard-button" disabled={sending} onClick={() => compose(message)}>Reply</button>}
      {readStatusError && <p role="alert">{readStatusError}</p>}
      <EmailBody message={message} />
      {message.truncated && <p className="dashboard-subtitle">This large message is partially displayed.</p>}
      {!!message.attachments.length && <p className="dashboard-subtitle">Attachments: {message.attachments.join(", ")} (view in Purelymail)</p>}
    </article>}
  </main>;

  return <main className="mail-workspace">
    <Link className="dashboard-link" href="/dashboard">← Back to Dashboard</Link>
    <header className="dashboard-header"><div><p className="dashboard-eyebrow">OATLE TECHNOLOGIES</p><h1>Inbox</h1><p className="dashboard-subtitle">{inbox?.address || "Your email inbox"}</p></div>
      <button className="dashboard-button" type="button" disabled={loading} onClick={() => loadPage(null)}>Refresh</button></header>
    {error && <p className="dashboard-form-error" role="alert">{error}</p>}
    <nav className="mail-views" aria-label="Email views">{(["inbox", "unread", "sent"] as const).map(option => <Link key={option} href={`/dashboard/inbox?view=${option}`} aria-current={view === option ? "page" : undefined}>{option === "inbox" ? "Inbox" : option === "unread" ? "Unread" : "Sent"}</Link>)}</nav>
    {sentNotice && <p role="status">{sentNotice}</p>}
    {inbox && !loading && <>
      <p className="dashboard-subtitle">{view === "sent" ? `${inbox.total} sent messages` : `${inbox.total} inbox messages · ${inbox.unread} unread`}</p>
      <button type="button" className="dashboard-button dashboard-button-primary" disabled={sending} onClick={() => compose()}>Compose email</button>
    </>}
    {composeForm}
    {loading ? <p role="status">Loading your inbox…</p> : inbox && <div className="mail-list-page">
      <section className="dashboard-panel mail-list" aria-label="Inbox messages">
        {!inbox.messages.length && <p className="dashboard-empty">{view === "sent" ? "No sent messages." : view === "unread" ? "No unread messages." : "No messages in your inbox."}</p>}
        {inbox.messages.map(item => <Link className="mail-row" key={item.uid} href={`/dashboard/inbox/${item.uid}?view=${view}&uid_validity=${inbox.uid_validity}${before ? `&before=${before}` : ""}`} prefetch={false}>
          <span className="mail-sender">{view === "sent" ? `To: ${item.to}` : item.sender}</span><span className="mail-subject">{item.unread && <span aria-label="Unread">● </span>}{item.subject}</span><span className="mail-date">{item.date}</span>
        </Link>)}
        <div className="mail-pagination">{before && <button type="button" className="dashboard-button" onClick={() => loadPage(null)}>Newest messages</button>}{inbox.next_before && <button type="button" className="dashboard-button" onClick={() => loadPage(inbox.next_before)}>Older messages</button>}</div>
      </section>
    </div>}
  </main>;
}


function EmailBody({ message }: { message: Message }) {
  const [height, setHeight] = useState(600);
  if (!message.html_body) return <div className="mail-body">{message.body || "This message has no readable text."}</div>;
  const policy = `default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src https: http: data:; base-uri 'none'; form-action 'none'`;
  const document = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>body{margin:0;padding:16px;font-family:Arial,sans-serif;color:#282822;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}pre{white-space:pre-wrap}</style></head><body>${message.html_body}</body></html>`;
  return <div className="mail-body">
    <iframe title="Formatted email" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" srcDoc={document} style={{ width: "100%", height, border: 0, marginTop: 12 }} onLoad={event => {
      const frame = event.currentTarget;
      const resize = () => setHeight(Math.max(200, frame.contentDocument?.documentElement.scrollHeight ?? 600));
      resize();
      frame.contentDocument?.querySelectorAll("img").forEach(img => { img.addEventListener("load", resize, { once: true }); img.addEventListener("error", resize, { once: true }); });
    }} />
  </div>;
}
