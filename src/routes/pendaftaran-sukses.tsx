import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Copy, FileText, Image as ImageIcon,
  Loader2, RefreshCcw, ShieldCheck, Download, FileSignature, Wallet, ClipboardCheck, FileBadge,
} from "lucide-react";
import { toast } from "sonner";
import {
  loadDocSettings,
  downloadLOA,
  downloadPaymentGuide,
  downloadAttendance,
  downloadProposalLetter,
} from "@/lib/selfFundedDocs";
import { supabase } from "@/integrations/supabase/client";
import { IslamicPattern } from "@/components/IslamicPattern";
import { WhatsAppChannelCTA } from "@/components/WhatsAppChannelCTA";
import logoSafarIman from "@/assets/logo-safar-iman.png";

export const Route = createFileRoute("/pendaftaran-sukses")({
  validateSearch: z.object({ code: z.string().optional() }),
  head: () => ({
    meta: [{ title: "Status Pendaftaran — Safar Iman" }],
  }),
  component: PendaftaranSukses,
});

type Status = {
  id: string;
  full_name: string;
  status: string;
  payment_status: string;
  payment_url: string | null;
  paid_at: string | null;
  category: string | null;
};

function PendaftaranSukses() {
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const code = (search?.get("code") ?? "").toUpperCase();
  const [info, setInfo] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const notifiedRef = useRef(false);
  const syncingRef = useRef(false);
  const lastSyncRef = useRef(0);

  const syncPendingPayment = async (row: Status) => {
    const now = Date.now();
    if (syncingRef.current || row.payment_status === "paid" || !row.payment_url || now - lastSyncRef.current < 15000) return;
    syncingRef.current = true;
    lastSyncRef.current = now;
    try {
      const { mayarPendaftaranInvoice } = await import("@/lib/api");
      const result = await mayarPendaftaranInvoice(code);
      if (result?.alreadyPaid || result?.synced) await fetchStatus();
    } catch {
      // Sinkronisasi cadangan tidak boleh mengganggu tampilan status utama.
    } finally {
      syncingRef.current = false;
    }
  };

  const fetchStatus = async () => {
    if (!code || code.length < 4) {
      setError("Kode pendaftaran tidak ditemukan di URL");
      return;
    }
    try {
      const { data, error } = await supabase.rpc("lookup_payment_status_by_code", { p_code: code });
      if (error) throw error;
      const row = data?.[0];
      if (!row) {
        setError("Peserta tidak ditemukan");
        return;
      }
      const nextInfo = row as Status;
      setInfo(nextInfo);
      setError(null);
      syncPendingPayment(nextInfo).catch(() => {});
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

  // Trigger WA notif sekali setelah paid
  useEffect(() => {
    if (info?.payment_status === "paid" && !notifiedRef.current) {
      notifiedRef.current = true;
      import("@/lib/api")
        .then(({ notifyWa, notifyEmail }) => {
          notifyWa("pendaftaran", code).catch(() => {});
          notifyEmail("pendaftaran", code).catch(() => {});
        })
        .catch(() => {});
    }
  }, [info?.payment_status, code]);

  const retryPayment = async () => {
    setRetrying(true);
    try {
      const { mayarPendaftaranInvoice } = await import("@/lib/api");
      const json = await mayarPendaftaranInvoice(code);
      if (!json.ok) throw new Error(json.error || "Gagal membuat invoice");
      if (json.alreadyPaid) {
        await fetchStatus();
        return;
      }
      if (json.url) window.location.href = json.url;
    } catch (e: any) {
      toast.error(e?.message || "Gagal memulai pembayaran");
    } finally {
      setRetrying(false);
    }
  };

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
              <p className="text-sm text-muted-foreground">Memeriksa status pendaftaran…</p>
            </div>
          ) : info.payment_status === "paid" ? (
            <PaidView code={code} info={info} />
          ) : (
            <PendingView code={code} info={info} onRetry={retryPayment} retrying={retrying} />
          )}
        </main>
      </div>
    </div>
  );
}

function PaidView({ code, info }: { code: string; info: Status }) {
  const copy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Kode disalin");
  };
  return (
    <div className="animate-fade-up">
      <div className="text-center mb-8">
        <div className="size-16 rounded-full bg-gradient-emerald grid place-items-center mx-auto mb-4 shadow-emerald">
          <CheckCircle2 className="size-8 text-accent" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">
          Pembayaran <span className="text-gradient-gold">berhasil</span>
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto">
          Barakallah, <strong>{info.full_name}</strong>! Biaya pendaftaranmu sudah tercatat. Berikut Kode Pendaftaranmu.
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

      {(info.category === "gelombang_1" || info.category === "gelombang_2") && (
        <GelombangFastTrackInfo />
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/twibbon" className="group bg-card border border-border rounded-2xl p-5 hover-lift flex items-start gap-4">
          <div className="size-12 rounded-xl bg-accent/20 grid place-items-center shrink-0">
            <ImageIcon className="size-5 text-accent" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Twibbon & Poster (Opsional)</div>
            <div className="text-sm text-muted-foreground mt-0.5">Bagikan kalau mau dukung jamaah lain</div>
          </div>
        </Link>
        <Link to="/sukses" className="group bg-card border border-accent rounded-2xl p-5 hover-lift flex items-start gap-4 shadow-gold/50">
          <div className="size-12 rounded-xl bg-gradient-gold grid place-items-center shrink-0">
            <FileText className="size-5 text-emerald-deep" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Cek Status</div>
            <div className="text-sm text-muted-foreground mt-0.5">Lihat progres pendaftaranmu kapan saja</div>
          </div>
        </Link>
      </div>

      {info.category === "self_funded" && (
        <SelfFundedDocs code={code} fullName={info.full_name} />
      )}
    </div>
  );
}

function GelombangFastTrackInfo() {
  const items = [
    {
      title: "Lolos Tahapan Bagikan Twibbon & Poster",
      desc: "Sebagai peserta jalur Fast Track, kamu otomatis dibebaskan dari kewajiban membagikan twibbon dan poster.",
    },
    {
      title: "Lolos Pengiriman Administrasi Berkas",
      desc: "Kamu juga otomatis dianggap lolos tahap pengiriman administrasi berkas tanpa perlu mengirimkan apapun.",
    },
  ];
  return (
    <div className="mb-8 rounded-3xl border border-emerald/30 bg-gradient-to-br from-emerald/5 to-accent/5 p-5 sm:p-6 animate-fade-up">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="size-5 text-emerald" />
        <div className="font-display text-lg font-semibold">Informasi Jalur Fast Track</div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Pembayaranmu sudah valid. Kamu tidak perlu mengikuti tahapan berikut karena sudah dinyatakan lolos:
      </p>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.title} className="flex items-start gap-3 rounded-2xl bg-card border border-border p-3.5">
            <div className="size-9 rounded-xl bg-emerald/15 text-emerald grid place-items-center shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{it.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{it.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
        Status pendaftaranmu kini <strong>Lolos</strong>. Tunggu informasi lanjutan dari panitia melalui email & WhatsApp.
      </p>
    </div>
  );
}

function SelfFundedDocs({ code, fullName }: { code: string; fullName: string }) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      const settings = await loadDocSettings();
      // settings loaded inside each downloader; we just pass code/name
      await fn();
    } catch (e: any) {
      toast.error(e?.message || "Gagal membuat dokumen");
    } finally {
      setBusy(null);
    }
  };

  const docs = [
    {
      key: "loa",
      icon: FileSignature,
      title: "Letter of Acceptance",
      desc: "Surat resmi penerimaan sebagai peserta Self Funded.",
      action: async () => {
        const s = await loadDocSettings();
        await downloadLOA({ fullName, code }, s);
      },
    },
    {
      key: "pay",
      icon: Wallet,
      title: "Panduan Pembayaran",
      desc: "Rincian nominal, rekening, dan tata cara pembayaran.",
      action: async () => {
        const s = await loadDocSettings();
        await downloadPaymentGuide({ fullName, code }, s);
      },
    },
    {
      key: "att",
      icon: ClipboardCheck,
      title: "Form Konfirmasi Kehadiran",
      desc: "Cetak, isi, tanda tangani, lalu kirim kembali ke panitia.",
      action: async () => {
        const s = await loadDocSettings();
        await downloadAttendance({ fullName, code }, s);
      },
    },
    {
      key: "prop",
      icon: FileBadge,
      title: "Surat Pengantar Proposal",
      desc: "Untuk diajukan ke donatur/sponsor/instansi pendukung.",
      action: async () => {
        const s = await loadDocSettings();
        await downloadProposalLetter({ fullName, code }, s);
      },
    },
  ];

  return (
    <div className="mt-10">
      <div className="text-center mb-5">
        <h2 className="font-display text-2xl font-semibold">Dokumen Self Funded</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
          Sebagai peserta jalur Self Funded yang sudah <strong>Lolos</strong>, kamu bisa langsung
          mengunduh dokumen-dokumen berikut.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {docs.map((d) => {
          const Icon = d.icon;
          const loading = busy === d.key;
          return (
            <button
              key={d.key}
              onClick={() => run(d.key, d.action)}
              disabled={loading}
              className="text-left bg-card border border-border rounded-2xl p-5 hover-lift flex items-start gap-4 disabled:opacity-60"
            >
              <div className="size-12 rounded-xl bg-emerald/10 text-emerald grid place-items-center shrink-0">
                {loading ? <Loader2 className="size-5 animate-spin" /> : <Icon className="size-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-base font-semibold flex items-center gap-1.5">
                  {d.title}
                  <Download className="size-3.5 opacity-60" />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{d.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground text-center mt-3">
        Dokumen di-generate otomatis. TTD, stempel, nama & isi teks dikelola panitia melalui Pengaturan Admin.
      </p>
    </div>
  );
}

function PendingView({
  code, info, onRetry, retrying,
}: { code: string; info: Status; onRetry: () => void; retrying: boolean }) {
  return (
    <div className="animate-fade-up">
      <div className="text-center mb-8">
        <Loader2 className="size-12 animate-spin text-accent mx-auto mb-4" />
        <h1 className="font-display text-3xl font-semibold">Menunggu Pembayaran</h1>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto">
          Halo <strong>{info.full_name}</strong>, kami sedang menunggu konfirmasi pembayaranmu.
          Halaman ini akan otomatis ter-update setiap 5 detik.
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm">
          <div className="font-semibold mb-1 flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-amber-600" /> Status: {info.payment_status}
          </div>
          <p className="text-muted-foreground">
            Kode pendaftaranmu akan ditampilkan otomatis setelah pembayaran sukses.
            Jangan tutup halaman ini sampai pembayaran selesai.
          </p>
        </div>

        {info.payment_url && (
          <a
            href={info.payment_url}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-7 py-4 text-base font-bold shadow-gold hover-lift"
          >
            Buka Halaman Pembayaran <ArrowRight className="size-4" />
          </a>
        )}

        <button
          onClick={onRetry}
          disabled={retrying}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/40 px-7 py-3 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
        >
          {retrying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
          Buat Ulang Link Pembayaran
        </button>

        <div className="text-center text-xs text-muted-foreground">
          Kode sementara: <span className="font-mono">{code}</span>
        </div>
      </div>
    </div>
  );
}
