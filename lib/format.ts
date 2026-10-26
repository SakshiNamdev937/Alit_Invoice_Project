
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatNumber(value: number | null | undefined, decimals = 2) {
  const n = Number(value ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatMoney(value: number | null | undefined, symbol: string) {
  return `${symbol ? symbol + " " : ""}${formatNumber(value)}`;
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${MONTHS[Number(m) - 1]}-${y}`;
}

export function formatMonth(iso: string) {
  const [y, m] = iso.slice(0, 10).split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function toIsoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
