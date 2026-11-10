// datetime-local has no offset: format in the device's local timezone, just as
// new Date(inputValue) interprets the value when the form is submitted.
export function toLocalDateTime(value: string | null | undefined): string {
  if (!value) return "";
  // The backend also returns naive timestamps, which represent UTC.
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
