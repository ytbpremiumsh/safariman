import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Copy, FileText, HeartHandshake,
  Loader2, RefreshCcw, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { IslamicPattern } from "@/components/IslamicPattern";
import { WhatsAppChannelCTA } from "@/components/WhatsAppChannelCTA";
import logoSafarIman from "@/assets/logo-safar-iman.png";

export const Route = createFileRoute("/kontribusi-sukses")({
  validateSearch: z.object({ code: z.string().optional() }),
  head: () => ({
    meta: [{ title: "Status Kontribusi — Safar Iman" }],
  }),
  component: KontribusiSukses,
});

type Status = {
  id: string;
  full_name: string;
  status: string;
  donation_status: string;
  donation_url: string | null;
  donation_paid_at: string | null;
  category: string | null;
};

function KontribusiSukses() {
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const code = (search?.get("code") ?? "").toUpperCase();
  const [info, setInfo] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const notifiedRef = useRef(false);
  const syncingRef = useRef(false);
  const lastSyncRef = useRef(0);

  const syncPending = async (row: Status) => {
    const now = Date.now();
    if (syncingRef.current || row.donation_status === "paid" || now - lastSyncRef.current < 15000) return;
    syncingRef.current = true;
    lastSyncRef.current = now;
    try {
      const { mayarCreateInvoice } = await import("@/lib/api");
      const result = await mayarCreateInvoice(code, false, true);
      if (result?.alreadyPaid || result?.synced) await fetchStatus();
    } catch {
      // silent
    } finally {
      syncingRef.current = false;
    }
  };

  const fetchStatus = async () => {
    if (!code || code.length < 4) { setError("Kode tidak ditemukan di URL"); return; }
    try {
      const { data, error } = await supabase.rpc("lookup_payment_status_by_code", { p_code: code });
      if (error) throw error;
      const row = data?.[0];
      if (!row) { setError("Peserta tidak ditemukan"); return; }
      const next = row as Status;
      setInfo(next);
      setError(null);
      syncPending(next).catch(() => {});
    } catch (e) {
      console.error(e);
      setError("Gagal memeriksa status");
    }
  };

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    if (info?.donation_status === "paid" && !notifiedRef.current) {
      notifiedRef.current = true;
      import("@/lib/api").then(({ notifyEmail }) => {
        notifyEmail("kontribusi", code).catch(() => {});
      }).catch(() => {});
    }
  }, [info?.donation_status, code]);

  const retryPayment = async () => {
    setRetrying(true);
    try {
      const { mayarCreateInvoice } = await import("@/lib/api");
      const json = await mayarCreateInvoice(code, true);
      if (!json.ok) throw new Error(json.error || "Gagal membuat invoice");
      if (json.alreadyPaid) { await fetchStatus(); return; }
      if (json.url) window.location.href = json.url;
    } catch (e: any) {
      toast.error(e?.message || "Gagal memulai pembayaran");
    } finally {
      setRetrying(false);
    }
  };

  const copy = () => { navigator.clipboard.writeText(code); toast.success("Kode disalin"); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/40 via-background to-secondary/30 relative">
      <IslamicPattern className="absolute inset-0 size-full text-emerald/5" />
      <div className="relative">
        <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src={logoSafarIman} alt="Safar Iman" className="h-10 sm:h-11 w-auto" />
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="size-4" /> Beranda
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
          {error ? (
            <div className="rounded-3xl bg-card border border-border p-8 text-center">
              <div className="font-display text-xl font-semibold mb-2">Tidak dapat memeriksa status</div>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : !info ? (
            <div className="rounded-3xl bg-card border border-border p-10 text-center">
              <Loader2 className="size-8 animate-spin text-accent mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Memeriksa status kontribusi…</p>
            </div>
          ) : info.donation_status === "paid" ? (
            <div className="animate-fade-up">
              <div className="text-center mb-8">
                <div className="size-16 rounded-full bg-gradient-emerald grid place-items-center mx-auto mb-4 shadow-emerald">
                  <HeartHandshake className="size-8 text-accent" />
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-semibold">
                  Kontribusi <span className="text-gradient-gold">berhasil</span>
                </h1>
                <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                  Barakallahu fiik, <strong>{info.full_name}</strong>! Kontribusi kebaikanmu sudah tercatat
                  {info.donation_paid_at ? ` pada ${new Date(info.donation_paid_at).toLocaleString("id-ID")}` : ""}.
                </p>
              </div>

              <div className="bg-gradient-emerald rounded-3xl p-8 text-center shadow-emerald mb-8">
                <div className="text-xs uppercase tracking-[0.3em] text-accent/80 mb-3">Kode Pendaftaran</div>
                <div className="font-mono text-3xl sm:text-5xl font-bold text-gradient-gold tracking-[0.15em] mb-4 break-all">
                  {code}
                </div>
                <button onClick={copy} className="inline-flex items-center gap-2 text-sm text-accent/90 hover:text-accent">
                  <Copy className="size-4" /> Salin Kode
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  to="/essay"
                  search={{ code }}
                  className="group bg-card border border-accent rounded-2xl p-5 hover-lift flex items-start gap-4 shadow-gold/50"
                >
                  <div className="size-12 rounded-xl bg-gradient-gold grid place-items-center shrink-0">
                    <FileText className="size-5 text-emerald-deep" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-semibold">Lanjut ke Essay & Studi Kasus</div>
                    <div className="text-sm text-muted-foreground mt-0.5">Tahap berikutnya sudah terbuka</div>
                  </div>
                </Link>
                <Link to="/cek-tahapan" className="group bg-card border border-border rounded-2xl p-5 hover-lift flex items-start gap-4">
                  <div className="size-12 rounded-xl bg-accent/20 grid place-items-center shrink-0">
                    <CheckCircle2 className="size-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-semibold">Cek Tahapan</div>
                    <div className="text-sm text-muted-foreground mt-0.5">Pantau progres seleksimu</div>
                  </div>
                </Link>
              </div>

              <div className="mt-6">
                <WhatsAppChannelCTA />
              </div>
            </div>
          ) : (
            <div className="animate-fade-up">
              <div className="text-center mb-8">
                <Loader2 className="size-12 animate-spin text-accent mx-auto mb-4" />
                <h1 className="font-display text-3xl font-semibold">Menunggu Konfirmasi Pembayaran</h1>
                <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                  Halo <strong>{info.full_name}</strong>, kami sedang memverifikasi kontribusimu.
                  Halaman ini otomatis ter-update setiap 5 detik.
                </p>
              </div>

              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm">
                  <div className="font-semibold mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-amber-600" /> Status: {info.donation_status || "pending"}
                  </div>
                  <p className="text-muted-foreground">
                    Kalau kamu belum menyelesaikan pembayaran, buka kembali halaman pembayaran di bawah ini.
                  </p>
                </div>

                {info.donation_url && (
                  <a
                    href={info.donation_url}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-bold shadow-gold hover-lift"
                  >
                    Buka Halaman Pembayaran <ArrowRight className="size-4" />
                  </a>
                )}

                <button
                  onClick={retryPayment}
                  disabled={retrying}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/40 px-7 py-3 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
                >
                  {retrying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                  Buat Ulang Link Pembayaran
                </button>

                <div className="text-center text-xs text-muted-foreground">
                  Kode: <span className="font-mono">{code}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
