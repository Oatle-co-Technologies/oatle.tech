export type EmailDraft = { recipient: string; subject: string; body: string; reply?: { uid: number; uid_validity: number; view: "inbox" | "unread" | "sent" } };
export const emptyEmailDraft = (): EmailDraft => ({ recipient: "", subject: "", body: "" });
export function parseEmailDraft(value: string | null): EmailDraft {
  try {
    const draft = JSON.parse(value || "null");
    if (!draft || ![draft.recipient, draft.subject, draft.body].every(v => typeof v === "string")) return emptyEmailDraft();
    if (draft.recipient.length > 320 || draft.subject.length > 200 || draft.body.length > 100000) return emptyEmailDraft();
    const reply = draft.reply;
    const validReply = reply && Number.isSafeInteger(reply.uid) && reply.uid > 0 && Number.isSafeInteger(reply.uid_validity) && reply.uid_validity > 0 && ["inbox", "unread", "sent"].includes(reply.view);
    return { recipient: draft.recipient, subject: draft.subject, body: draft.body, ...(validReply ? { reply } : {}) };
  } catch { return emptyEmailDraft(); }
}
export const emailDraftKey = (staffId: number) => `oatle:email-draft:v1:${staffId}`;
