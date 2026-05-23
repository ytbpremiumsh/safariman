import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Download, MessageCircle, Sparkles, Image as ImageIcon, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";
import twibbonFrame from "@/assets/twibbon.png";

const CP_WHATSAPP = "6281234567890"; // ganti dengan nomor CP resmi
const CP_NAME = "CP Safar Iman";

export const Route = createFileRoute("/twibbon")({
  head: () => ({
    meta: [
      { title: "Twibbon — Safar Iman" },
      { name: "description", content: "Download twibbon Safar Iman dan kirim ke CP." },
    ],
  }),
  component: TwibbonPage,
});

type Stored = { id: string; token: string; name: string };

function TwibbonPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Stored | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("safariman_participant");
    if (!raw) { navigate({ to: "/daftar" }); return; }
    try { setMe(JSON.parse(raw)); } catch { navigate({ to: "/daftar" }); }
  }, [navigate]);

  const downloadTwibbon = async () => {
    try {
      const res = await fetch(twibbonFrame);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "safar-iman-twibbon.png";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("Twibbon berhasil didownload!");
    } catch {
      toast.error("Gagal download. Coba lagi.");
    }
  };

  const waMessage = encodeURIComponent(
    `Assalamu'alaikum, saya ${me?.name ?? ""} sudah mendaftar program Safar Iman dan mengirimkan bukti twibbon. Mohon konfirmasinya. Jazakallahu khairan 🙏`
  );

  const copyMessage = async () => {
    await navigator.clipboard.writeText(decodeURIComponent(waMessage));
    toast.success("Pesan disalin!");
  };

  const confirmAndNext = async () => {
    if (!me) return;
    setConfirming(true);
    try {
      const { error } = await supabase.rpc("update_participant_with_token", {
        p_id: me.id, p_token: me.token, p_twibbon_confirmed: true,
      });
      if (error) throw error;
      toast.success("Twibbon dikonfirmasi. Lanjut upload berkas!");
      navigate({ to: "/berkas" });
    } catch (e) {
      console.error(e);
      toast.error("Gagal konfirmasi. Coba lagi.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/40 via-background to-secondary/30 relative">
      <IslamicPattern className="absolute inset-0 size-full text-emerald/5" />
      <div className="relative">
        <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-gradient-emerald grid place-items-center">
                <Sparkles className="size-4 text-accent" />
              </div>
              <div>
                <div className="font-display text-lg font-semibold leading-none">Safar Iman</div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Step 2 · Twibbon</div>
              </div>
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="size-4" /> Beranda
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="text-center mb-10 animate-fade-up">
            <GeometricOrnament className="w-32 h-8 text-accent mx-auto mb-3 opacity-70" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald/10 text-emerald text-xs font-semibold tracking-wider uppercase">
              <CheckCircle2 className="size-3.5" /> Pendaftaran Terkirim
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold mt-4 leading-tight">
              Yuk Bikin <span className="text-gradient-gold">Twibbon</span>mu
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Sebarkan semangat Safar Iman! Download twibbon, posting di sosmed, lalu kirim screenshot ke CP kami.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-start">
            {/* Twibbon preview */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-soft animate-fade-up">
              <div className="aspect-square rounded-2xl overflow-hidden bg-secondary relative shadow-emerald">
                <img src={twibbonFrame} alt="Twibbon Safar Iman" className="size-full object-cover" width={1024} height={1024} loading="lazy" />
              </div>
              <button
                onClick={downloadTwibbon}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-6 py-3.5 text-sm font-semibold shadow-emerald hover-lift"
              >
                <Download className="size-4" /> Download Twibbon
              </button>
            </div>

            {/* Instructions */}
            <div className="space-y-5">
              <Card n={1} title="Download Twibbon" icon={<Download className="size-5" />}>
                Klik tombol "Download Twibbon" untuk menyimpan frame.
              </Card>
              <Card n={2} title="Pasang Fotomu" icon={<ImageIcon className="size-5" />}>
                Buka di aplikasi edit foto favoritmu (Canva / PicsArt / Photoshop). Letakkan foto kamu di area tengah frame.
              </Card>
              <Card n={3} title="Posting di Instagram / Twitter" icon={<Sparkles className="size-5" />}>
                Upload di feed/story dengan caption dakwah & tag <strong className="text-foreground">@safariman.id</strong>. Gunakan hashtag <strong className="text-foreground">#SafarIman #UmrahGratisBerprestasi</strong>.
              </Card>
              <Card n={4} title="Kirim Bukti ke CP" icon={<MessageCircle className="size-5" />}>
                Screenshot postinganmu, lalu kirim ke {CP_NAME} via WhatsApp.
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/${CP_WHATSAPP}?text=${waMessage}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-5 py-2.5 text-sm font-bold shadow-gold hover-lift"
                  >
                    <MessageCircle className="size-4" /> Chat CP
                  </a>
                  <button
                    onClick={copyMessage}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-secondary"
                  >
                    <Copy className="size-4" /> Salin Pesan
                  </button>
                </div>
              </Card>

              <button
                onClick={confirmAndNext}
                disabled={confirming}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-6 py-4 text-base font-bold shadow-emerald hover-lift disabled:opacity-60"
              >
                {confirming ? <><Loader2 className="size-4 animate-spin" /> Memproses...</> : <>Saya Sudah Kirim ke CP — Lanjut Upload Berkas <ArrowRight className="size-4" /></>}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Card({ n, title, icon, children }: { n: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft flex gap-4 animate-fade-up">
      <div className="size-11 shrink-0 rounded-xl bg-gradient-emerald grid place-items-center text-accent shadow-emerald">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.25em] text-accent font-semibold">Langkah {n}</div>
        <h3 className="font-display text-lg font-semibold mt-0.5">{title}</h3>
        <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
