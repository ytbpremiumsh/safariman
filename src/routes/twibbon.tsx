import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Download, MessageCircle, Sparkles, Image as ImageIcon, Copy, FileText, Instagram, CheckCircle2, Upload, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { IslamicPattern, GeometricOrnament } from "@/components/IslamicPattern";
import defaultFrame from "@/assets/twibbon.png";
import logoSafarIman from "@/assets/logo-safar-iman.png";

const CP_WHATSAPP = "6281234567890";
const CP_NAME = "CP Safar Iman";

const IG_ACCOUNTS = [
  { handle: "safariman.id", url: "https://instagram.com/safariman.id", label: "Safar Iman" },
  { handle: "hasanah.tours.travel", url: "https://instagram.com/hasanah.tours.travel", label: "Hasanah Tours" },
  { handle: "hasanah.hajiumrohsemarang", url: "https://instagram.com/hasanah.hajiumrohsemarang", label: "Hasanah Semarang" },
  { handle: "prestasikita", url: "https://instagram.com/prestasikita", label: "Prestasi Kita" },
];

const EXPORT_MAX = 1080;

export const Route = createFileRoute("/twibbon")({
  head: () => ({
    meta: [
      { title: "Twibbon — Safar Iman" },
      { name: "description", content: "Buat twibbon Safar Iman langsung di sini — upload foto, atur, lalu download." },
    ],
  }),
  component: TwibbonPage,
});

function TwibbonPage() {
  const [frameUrl, setFrameUrl] = useState<string>(defaultFrame);
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number; px: number; py: number } | null>(null);
  const [pinch, setPinch] = useState<{ dist: number; scale: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load configurable frame URL
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_twibbon_frame_url");
      if (data && typeof data === "string" && data.trim()) {
        setFrameUrl(data.trim());
      }
    })();
  }, []);

  // Load frame image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setFrameImg(img);
    img.onerror = () => {
      // fallback to bundled default
      const fb = new Image();
      fb.onload = () => setFrameImg(fb);
      fb.src = defaultFrame;
    };
    img.src = frameUrl;
  }, [frameUrl]);

  // Derive export dimensions from frame's natural size (longest side = EXPORT_MAX)
  const exportDims = (() => {
    if (!frameImg) return { w: EXPORT_MAX, h: EXPORT_MAX };
    const fw = frameImg.naturalWidth || frameImg.width;
    const fh = frameImg.naturalHeight || frameImg.height;
    const s = EXPORT_MAX / Math.max(fw, fh);
    return { w: Math.round(fw * s), h: Math.round(fh * s) };
  })();
  const EW = exportDims.w;
  const EH = exportDims.h;

  // Render canvas whenever inputs change
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = EW;
    c.height = EH;
    // background
    ctx.fillStyle = "#0d3b2e";
    ctx.fillRect(0, 0, EW, EH);

    if (photoImg) {
      // base "cover" size relative to frame dims
      const ratio = photoImg.width / photoImg.height;
      const frameRatio = EW / EH;
      let baseW = EW;
      let baseH = EH;
      if (ratio > frameRatio) baseW = EH * ratio; else baseH = EW / ratio;
      const w = baseW * scale;
      const h = baseH * scale;
      const x = (EW - w) / 2 + pos.x;
      const y = (EH - h) / 2 + pos.y;
      ctx.drawImage(photoImg, x, y, w, h);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(0, 0, EW, EH);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "600 36px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Upload foto kamu di sini", EW / 2, EH / 2 - 10);
      ctx.font = "400 22px system-ui, sans-serif";
      ctx.fillText("Lalu atur posisi & zoom", EW / 2, EH / 2 + 30);
    }

    if (frameImg) {
      ctx.drawImage(frameImg, 0, 0, EW, EH);
    }
  }, [frameImg, photoImg, scale, pos, EW, EH]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("File harus berupa gambar"); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("Maks 10MB"); return; }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setPhotoImg(img);
      setScale(1);
      setPos({ x: 0, y: 0 });
      toast.success("Foto siap — atur posisi & zoom");
    };
    img.onerror = () => toast.error("Gagal membaca gambar");
    img.src = url;
  };

  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }); };

  const download = async () => {
    const c = canvasRef.current;
    if (!c) return;
    if (!photoImg) { toast.error("Upload foto kamu dulu"); return; }

    const triggerDownload = (href: string, revoke?: () => void) => {
      const a = document.createElement("a");
      a.href = href;
      a.download = "twibbon-safar-iman.png";
      document.body.appendChild(a); a.click(); a.remove();
      if (revoke) setTimeout(revoke, 1000);
      toast.success("Twibbon berhasil didownload!");
    };

    // Try blob first
    try {
      const blob: Blob | null = await new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"));
      if (blob) {
        const url = URL.createObjectURL(blob);
        triggerDownload(url, () => URL.revokeObjectURL(url));
        return;
      }
    } catch (e) {
      // canvas tainted — try re-rendering with same-origin proxied frame, fallback below
    }

    // Fallback: try dataURL (also fails if tainted)
    try {
      const dataUrl = c.toDataURL("image/png");
      triggerDownload(dataUrl);
    } catch {
      toast.error("Gagal download. Frame gambar tidak mengizinkan CORS — hubungi admin untuk mengganti frame.");
    }
  };

  // Drag / pinch handlers (in CSS px → convert to canvas px via ratio)
  const ratio = () => {
    const c = canvasRef.current;
    if (!c) return 1;
    return EW / c.getBoundingClientRect().width;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!photoImg) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrag({ x: e.clientX, y: e.clientY, px: pos.x, py: pos.y });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const r = ratio();
    setPos({ x: drag.px + (e.clientX - drag.x) * r, y: drag.py + (e.clientY - drag.y) * r });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    setDrag(null);
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
  };
  const onWheel = (e: React.WheelEvent) => {
    if (!photoImg) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setScale((s) => Math.min(5, Math.max(0.3, s + delta)));
  };
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setPinch({ dist: Math.hypot(dx, dy), scale });
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      setScale(Math.min(5, Math.max(0.3, pinch.scale * (d / pinch.dist))));
    }
  };
  const onTouchEnd = () => setPinch(null);

  const waMessage = encodeURIComponent(
    `Assalamu'alaikum, saya ingin mengirimkan bukti twibbon program Safar Iman. Saya sudah follow seluruh akun Instagram resmi. Jazakallahu khairan 🙏`
  );
  const copyMessage = async () => {
    await navigator.clipboard.writeText(decodeURIComponent(waMessage));
    toast.success("Pesan disalin!");
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

        <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="text-center mb-10 animate-fade-up">
            <GeometricOrnament className="w-32 h-8 text-accent mx-auto mb-3 opacity-70" />
            <h1 className="font-display text-3xl sm:text-5xl font-semibold leading-tight">
              Bagikan <span className="text-gradient-gold">Twibbon</span> Kamu
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Tunjukkan dukunganmu untuk Safar Iman. Upload foto, atur posisi, lalu bagikan ke teman dan keluargamu.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start mb-8">
            {/* Composer */}
            <div className="lg:col-span-3 flex justify-center">
              <div className="w-full max-w-xl bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-soft animate-fade-up">
              <div
                className="rounded-2xl overflow-hidden bg-secondary relative shadow-emerald select-none touch-none mx-auto w-full"
                style={{ aspectRatio: `${EW} / ${EH}`, maxHeight: "70vh", cursor: photoImg ? (drag ? "grabbing" : "grab") : "default" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <canvas ref={canvasRef} className="size-full block" />
              </div>

              {/* Controls */}
              <div className="mt-4 space-y-3">
                <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-5 py-3 text-sm font-semibold shadow-emerald hover-lift"
                  >
                    <Upload className="size-4" /> {photoImg ? "Ganti Foto" : "Upload Foto"}
                  </button>
                  <button
                    onClick={download}
                    disabled={!photoImg}
                    className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-5 py-3 text-sm font-bold shadow-gold hover-lift disabled:opacity-50"
                  >
                    <Download className="size-4" /> Download Twibbon
                  </button>
                </div>

                {photoImg && (
                  <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 border border-border px-4 py-3">
                    <ZoomOut className="size-4 text-muted-foreground shrink-0" />
                    <input
                      type="range"
                      min={0.3}
                      max={5}
                      step={0.01}
                      value={scale}
                      onChange={(e) => setScale(parseFloat(e.target.value))}
                      className="flex-1 accent-emerald"
                    />
                    <ZoomIn className="size-4 text-muted-foreground shrink-0" />
                    <button
                      onClick={reset}
                      className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      title="Reset posisi"
                    >
                      <RotateCcw className="size-3.5" /> Reset
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Geser foto untuk memindahkan • scroll / pinch / slider untuk zoom
                </p>
              </div>
            </div>
            </div>

            {/* Steps */}
            <div className="lg:col-span-2 space-y-4">
              <Step n={1} title="Upload Foto" icon={<ImageIcon className="size-5" />}>
                Pilih foto terbaikmu. Frame Safar Iman akan otomatis menyesuaikan.
              </Step>

              <Step n={2} title="Wajib Follow Instagram" icon={<Instagram className="size-5" />} highlight>
                <p className="mb-3">
                  Sebelum download, pastikan kamu sudah <strong className="text-foreground">follow keempat akun</strong> berikut:
                </p>
                <div className="grid gap-2">
                  {IG_ACCOUNTS.map((acc) => (
                    <a
                      key={acc.handle}
                      href={acc.url}
                      target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-2.5 rounded-xl border border-border bg-background/60 hover:bg-secondary px-3 py-2 transition-colors"
                    >
                      <div className="size-7 shrink-0 rounded-lg bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5] grid place-items-center text-white">
                        <Instagram className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-muted-foreground leading-tight">{acc.label}</div>
                        <div className="text-xs font-semibold text-foreground truncate">@{acc.handle}</div>
                      </div>
                      <ArrowRight className="size-3 text-muted-foreground group-hover:text-foreground shrink-0" />
                    </a>
                  ))}
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-emerald shrink-0 mt-0.5" />
                  <span>Bukti follow akan diminta CP saat verifikasi.</span>
                </div>
              </Step>

              <Step n={3} title="Posting & Kirim ke CP" icon={<Sparkles className="size-5" />}>
                <p>
                  Upload di feed/story, tag <strong className="text-foreground">@safariman.id</strong> + hashtag{" "}
                  <strong className="text-foreground">#SafarIman</strong>. Lalu kirim ke {CP_NAME}.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/${CP_WHATSAPP}?text=${waMessage}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-emerald-deep px-4 py-2 text-xs font-bold shadow-gold hover-lift"
                  >
                    <MessageCircle className="size-3.5" /> Chat CP
                  </a>
                  <button
                    onClick={copyMessage}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-secondary"
                  >
                    <Copy className="size-3.5" /> Salin Pesan
                  </button>
                </div>
              </Step>
            </div>
          </div>

          <Link
            to="/berkas"
            className="w-full max-w-2xl mx-auto flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-6 py-4 text-base font-bold shadow-emerald hover-lift"
          >
            <FileText className="size-4" /> Lanjut Kirim Berkas <ArrowRight className="size-4" />
          </Link>
        </main>
      </div>
    </div>
  );
}

function Step({ n, title, icon, children, highlight }: { n: number; title: string; icon: React.ReactNode; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`bg-card border rounded-2xl p-4 shadow-soft flex gap-3 animate-fade-up ${highlight ? "border-accent/40 ring-1 ring-accent/20" : "border-border"}`}>
      <div className="size-10 shrink-0 rounded-xl bg-gradient-emerald grid place-items-center text-accent shadow-emerald">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-accent font-semibold">Langkah {n}</div>
        <h3 className="font-display text-base font-semibold mt-0.5">{title}</h3>
        <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
