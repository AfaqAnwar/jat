/** Convert stored YYYY-MM-DD to display MM-DD-YYYY */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return iso;
  return `${match[2]}-${match[3]}-${match[1]}`;
}

/** Convert display MM-DD-YYYY back to storage YYYY-MM-DD */
export function parseDate(display: string): string {
  if (!display) return "";
  const match = display.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return display;
  return `${match[3]}-${match[1]}-${match[2]}`;
}

/** Get today's date as YYYY-MM-DD (storage format) */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}
