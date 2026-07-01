// deno-lint-ignore-file no-explicit-any
// Helper untuk memastikan invoice Mayar memakai nama peserta yang benar.
//
// Mayar mengunci nama customer berdasarkan alamat email pertama yang pernah
// dipakai. Kalau email yang sama pernah dibuat untuk peserta dengan nama
// berbeda (mis. email admin dipakai testing beberapa kali), invoice baru
// tetap muncul "Kepada: <nama lama>" walau kita mengirim `name` yang berbeda.
//
// Solusi: kalau email yang sama sudah dipakai peserta dengan nama berbeda,
// pakai plus-alias `local+CODE@domain` untuk membuat identitas customer baru
// di Mayar. Gmail (dan mayoritas provider) tetap meneruskan ke inbox asli.

export function aliasEmailForMayar(email: string, code: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const safeCode = code.replace(/[^A-Za-z0-9._-]/g, "").toLowerCase();
  if (!safeCode) return email;
  // Hilangkan alias lama supaya tidak menumpuk (foo+abc → foo)
  const cleanLocal = local.split("+")[0];
  return `${cleanLocal}+${safeCode}@${domain}`;
}

// Cek apakah email participant ini pernah dipakai untuk nama lain.
// Kalau ya, kita gunakan plus-alias supaya Mayar melihatnya sebagai customer baru.
export async function resolveMayarEmail(
  supabaseAdmin: any,
  fullName: string,
  email: string,
  code: string,
): Promise<{ email: string; aliased: boolean }> {
  try {
    const { data } = await supabaseAdmin
      .from("participants")
      .select("full_name")
      .ilike("email", email)
      .neq("registration_code", code)
      .limit(50);
    const others: string[] = (data ?? [])
      .map((r: any) => (r.full_name || "").trim().toLowerCase())
      .filter(Boolean);
    const target = (fullName || "").trim().toLowerCase();
    const conflict = others.some((n) => n && n !== target);
    if (conflict) return { email: aliasEmailForMayar(email, code), aliased: true };
    return { email, aliased: false };
  } catch {
    return { email, aliased: false };
  }
}

// Best-effort upsert customer di Mayar. Tidak apa-apa kalau gagal (mis.
// customer sudah ada) — invoice tetap dibuat dengan field `name` di bawah.
export async function upsertMayarCustomer(
  apiKey: string,
  input: { name: string; email: string; mobile?: string },
) {
  try {
    await fetch("https://api.mayar.id/hl/v2/customers/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        mobile: input.mobile || "",
      }),
    });
  } catch (e) {
    console.warn("Gagal upsert Mayar customer", e);
  }
}
