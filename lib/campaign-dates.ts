export function johannesburgDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function displayDate(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(value + "T12:00:00+02:00"));
}
export function displayTimestamp(value: string): string {
  const utc = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : value + "Z";
  return new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "short" }).format(new Date(utc));
}
export function weekStart(value: string): string {
  const day = new Date(value + "T12:00:00Z");
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  return day.toISOString().slice(0, 10);
}
