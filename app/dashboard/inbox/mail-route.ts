export function mailRoute(query: Record<string, string | string[] | undefined>) {
  const positive = (value: string | string[] | undefined) => typeof value === "string" && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
  const view: "inbox" | "unread" | "sent" = query.view === "sent" ? "sent" : query.view === "unread" ? "unread" : "inbox";
  return { view, before: positive(query.before), validity: positive(query.uid_validity) };
}
