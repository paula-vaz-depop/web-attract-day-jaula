const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Reads the wall-clock fields straight off the ISO string, so the time stays in the venue's offset, not the viewer's.
export function formatWhen(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return iso;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const day = DAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
  return `${day} ${d} ${MONTHS[mo - 1]} · ${m[4]}:${m[5]}`;
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
