import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailX, XCircle } from "lucide-react";
import logoSafarIman from "@/assets/logo-safar-iman.png";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({ meta: [{ title: "Berhenti Berlangganan Email — Safar Iman" }] }),
  component: UnsubscribePage,
});

type State = "loading" | "valid" | "already" | "invalid" | "success" | "submitting" | "error";

function UnsubscribePage() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const token = params?.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  const url = (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, "") + "/functions/v1/handle-email-unsubscribe";
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  useEffect(() => {
    if (!token) { setState("invalid"); setMessage("Token tidak ditemukan di URL"); return; }
    (async () => {
      try {
        const res = await fetch(`${url}?token=${encodeURIComponent(token)}`, { headers: { apikey: anonKey } });
        const data = await res.json();
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else { setState("invalid"); setMessage(data.error || "Token tidak valid"); }
      } catch {
        setState("error"); setMessage("Tidak dapat memvalidasi token");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) setState("success");
      else if (data.reason === "already_unsubscribed") setState("already");
      else { setState("error"); setMessage(data.error || "Gagal memproses"); }
    } catch {
      setState("error"); setMessage("Gagal memproses permintaan");
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 grid place-items-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 text-center">
        <Link to="/" className="inline-block mb-5">
          <img src={logoSafarIman} alt="Safar Iman" className="h-10 w-auto mx-auto" />
        </Link>

        {state === "loading" && (
          <><Loader2 className="size-10 animate-spin text-accent mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Memvalidasi…</p></>
        )}

        {state === "valid" && (
          <>
            <div className="size-14 rounded-full bg-amber-500/10 grid place-items-center mx-auto mb-3">
              <MailX className="size-7 text-amber-600" />
            </div>
            <h1 className="font-display text-xl font-semibold mb-2">Berhenti berlangganan email?</h1>
            <p className="text-sm text-muted-foreground mb-5">
              Kamu tidak akan menerima email notifikasi dari Safar Iman lagi.
            </p>
            <button onClick={confirm} className="w-full rounded-full bg-foreground text-background px-5 py-3 text-sm font-semibold">
              Ya, berhenti berlangganan
            </button>
          </>
        )}

        {state === "submitting" && (
          <><Loader2 className="size-10 animate-spin text-accent mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Memproses…</p></>
        )}

        {state === "success" && (
          <>
            <div className="size-14 rounded-full bg-emerald/10 grid place-items-center mx-auto mb-3">
              <CheckCircle2 className="size-7 text-emerald" />
            </div>
            <h1 className="font-display text-xl font-semibold mb-2">Berhasil</h1>
            <p className="text-sm text-muted-foreground">Kamu sudah berhenti berlangganan email Safar Iman.</p>
          </>
        )}

        {state === "already" && (
          <>
            <div className="size-14 rounded-full bg-secondary grid place-items-center mx-auto mb-3">
              <CheckCircle2 className="size-7 text-muted-foreground" />
            </div>
            <h1 className="font-display text-xl font-semibold mb-2">Sudah berhenti berlangganan</h1>
            <p className="text-sm text-muted-foreground">Email ini sudah dihapus dari daftar penerima.</p>
          </>
        )}

        {(state === "invalid" || state === "error") && (
          <>
            <div className="size-14 rounded-full bg-destructive/10 grid place-items-center mx-auto mb-3">
              <XCircle className="size-7 text-destructive" />
            </div>
            <h1 className="font-display text-xl font-semibold mb-2">Tidak dapat diproses</h1>
            <p className="text-sm text-muted-foreground">{message || "Token tidak valid atau sudah kedaluwarsa."}</p>
          </>
        )}

        <div className="mt-6">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Kembali ke beranda</Link>
        </div>
      </div>
    </div>
  );
}
