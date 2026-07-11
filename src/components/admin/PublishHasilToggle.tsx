import { useEffect, useState } from "react";
import { Loader2, Megaphone, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  settingKey: "berkas_results_published" | "essay_results_published";
  label: string;
  description?: string;
};

export function PublishHasilToggle({ settingKey, label, description }: Props) {
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", settingKey)
        .maybeSingle();
      setPublished((data?.value ?? "false") === "true");
      setLoading(false);
    })();
  }, [settingKey]);

  const doToggle = async () => {
    const next = !published;
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_setting", {
      p_key: settingKey,
      p_value: next ? "true" : "false",
    });
    setBusy(false);
    setConfirming(false);
    if (error) { toast.error(error.message); return; }
    setPublished(next);
    toast.success(next ? `${label} dipublikasikan` : `Publikasi ${label} ditahan`);
  };

  if (loading) return null;

  return (
    <div
      className={`rounded-2xl border-2 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
        published
          ? "bg-emerald/10 border-emerald ring-2 ring-emerald/30"
          : "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700"
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className={`shrink-0 size-10 rounded-xl grid place-items-center ${
            published ? "bg-emerald text-white" : "bg-amber-400 text-white"
          }`}
        >
          {published ? <Megaphone className="size-5" /> : <EyeOff className="size-5" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                published ? "bg-emerald text-white" : "bg-amber-500 text-white"
              }`}
            >
              {published ? (
                <><CheckCircle2 className="size-3" /> Status: AKTIF</>
              ) : (
                <><AlertTriangle className="size-3" /> Status: NONAKTIF</>
              )}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {published ? "terlihat oleh peserta" : "tersembunyi dari peserta"}
            </span>
          </div>
          <div className="font-semibold text-sm mt-1">
            {published
              ? `Hasil ${label} sudah DIPUBLIKASIKAN`
              : `Hasil ${label} BELUM DIPUBLIKASIKAN`}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
            {description ?? (published
              ? "Peserta sudah dapat melihat keputusan di halaman Cek Tahapan. Klik “Tarik Publikasi” untuk menyembunyikannya kembali."
              : `Tandai semua keputusan terlebih dahulu, lalu klik "Publish Hasil" agar peserta dapat melihatnya di halaman Cek Tahapan.`)}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-stretch md:items-end gap-1 shrink-0">
        {confirming ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-secondary border border-border"
            >
              Batal
            </button>
            <button
              onClick={doToggle}
              disabled={busy}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg ${
                published ? "bg-red-600 hover:bg-red-700" : "bg-emerald hover:bg-emerald-deep"
              }`}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Ya, {published ? "tarik" : "publish"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
              published
                ? "bg-white text-red-700 border-2 border-red-300 hover:bg-red-50 dark:bg-transparent"
                : "bg-emerald text-white shadow-emerald hover-lift"
            }`}
          >
            <Megaphone className="size-4" />
            {published ? "Tarik Publikasi" : "Publish Hasil"}
          </button>
        )}
      </div>
    </div>
  );
}
