import { useEffect, useState } from "react";
import { Loader2, Megaphone, EyeOff } from "lucide-react";
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

  const toggle = async () => {
    const next = !published;
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_setting", {
      p_key: settingKey,
      p_value: next ? "true" : "false",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setPublished(next);
    toast.success(next ? `${label} dipublikasikan` : `Publikasi ${label} ditahan`);
  };

  if (loading) return null;

  return (
    <div className={`rounded-2xl border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
      published ? "bg-emerald/10 border-emerald/30" : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40"
    }`}>
      <div className="flex items-start gap-3">
        {published ? <Megaphone className="size-5 text-emerald shrink-0 mt-0.5" /> : <EyeOff className="size-5 text-amber-600 shrink-0 mt-0.5" />}
        <div>
          <div className="font-semibold text-sm">
            {published ? `Hasil ${label} sudah DIPUBLIKASIKAN` : `Hasil ${label} DITAHAN (belum dipublikasikan)`}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            {description ?? (published
              ? "Peserta sudah dapat melihat keputusan di halaman Cek Tahapan."
              : `Tandai semua keputusan terlebih dahulu, lalu klik "Publish" agar peserta dapat melihat hasilnya di halaman Cek Tahapan.`)}
          </p>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 shrink-0 ${
          published ? "bg-secondary text-foreground border border-border" : "bg-emerald text-white shadow-emerald hover-lift"
        }`}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
        {published ? "Tarik Publikasi" : "Publish Hasil"}
      </button>
    </div>
  );
}
