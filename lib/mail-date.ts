const emailDateFormatter = new Intl.DateTimeFormat("en-ZA", {
  timeZone: "Africa/Johannesburg",
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatEmailDate(value: string | null | undefined): string {
  if (!value?.trim()) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return emailDateFormatter.format(date);
}
