// deno-lint-ignore-file no-explicit-any
// Helper bersama untuk membaca status invoice Mayar.
// Dipakai oleh mayar-pendaftaran-invoice dan mayar-create-invoice supaya
// deteksi paid/expired konsisten di kedua jalur pembayaran.

export function isPaidLike(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  if (!v) return false;
  // Hindari false positive: "unpaid" mengandung substring "paid".
  if (/^un/.test(v) || /pending|fail|expire|cancel|refund|void|await|process/.test(v)) return false;
  return /\b(paid|success|successful|settled|completed|capture|captured|success_paid)\b/.test(v);
}

export function invoiceLooksExpired(payload: any): boolean {
  const data = payload?.data ?? payload;
  const statusStr = String(
    data?.status || data?.invoice?.status || data?.transactionStatus || data?.transaction_status || "",
  ).toLowerCase();
  if (/expire|expired|closed|cancel|canceled|cancelled|void/.test(statusStr)) return true;
  const t = parseInvoiceExpiry(payload);
  return t !== null && t.getTime() < Date.now();
}

// Ambil tanggal kedaluwarsa invoice dari berbagai bentuk field yang dipakai Mayar.
export function parseInvoiceExpiry(payload: any): Date | null {
  const data = payload?.data ?? payload;
  const raw =
    data?.expiredAt || data?.expired_at || data?.expiryDate || data?.expiry_date || data?.dueDate || data?.due_date;
  if (!raw) return null;
  const t = new Date(raw).getTime();
  if (Number.isNaN(t) || t <= 0) return null;
  return new Date(t);
}

// Perkiraan aman bila Mayar tidak mengirim tanggal kedaluwarsa.
// Dipakai hanya sebagai cache lokal; verifikasi asli tetap ke API Mayar.
export function fallbackExpiry(hours = 24): Date {
  return new Date(Date.now() + hours * 3600 * 1000);
}

// True jika cache masa berlaku masih aman dipakai (dengan margin 5 menit).
export function cachedInvoiceStillValid(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  if (Number.isNaN(t)) return false;
  return t - 5 * 60 * 1000 > Date.now();
}
