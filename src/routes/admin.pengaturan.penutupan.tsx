import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, FileText, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { AdminLoading, AdminShell, useAdminGuard } from "@/components/AdminShell";
import { fetchSubmissionAvailability, type SubmissionAvailability } from "@/lib/submission-availability";

export const Route = createFileRoute("/admin/pengaturan/penutupan")({
  head: () => ({ meta: [{ title: "Penutupan Tahapan — Safar Iman Admin" }] }),
  component: SubmissionClosureSettings,
});

const CONTROLS = [
  {
    field: "registration_open",
    setting: "registration_open",
    title: "Form Pendaftaran",
    description: "Mengatur seluruh jalur: Reguler, Gelombang 1/2, dan Self Funded.",
    icon: UserPlus,
  },
  {
    field: "berkas_open",
    setting: "berkas_submission_open",
    title: "Pengiriman Berkas",
    description: "Mencegah peserta baru mengirim atau memperbarui berkas melalui kode pendaftaran.",
    icon: ClipboardList,
  },
  {
    field: "essay_open",
    setting: "essay_submission_open",
    title: "Essay & Studi Kasus",
    description: "Mencegah pengiriman baru Essay dan seluruh Studi Kasus.",
    icon: FileText,
  },
] as const;

function SubmissionClosureSettings() {
  const ready = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<SubmissionAvailability>({
    registration_open: false,
    berkas_open: false,
    essay_open: false,
  });

  useEffect(() => {
    if (!ready) return;
    fetchSubmissionAvailability().then((result) => {
      setValues(result);
      setLoading(false);
    });
  }, [ready]);

  const toggle = async (control: (typeof CONTROLS)[number], next: boolean) => {
    const previous = values[control.field];
    setValues((current) => ({ ...current, [control.field]: next }));
    setSaving(control.field);
    const { error } = await supabase.rpc("admin_set_setting", {
      p_key: control.setting,
      p_value: next ? "true" : "false",
    });
    setSaving(null);
    if (error) {
      setValues((current) => ({ ...current, [control.field]: previous }));
      toast.error(error.message);
      return;
    }
    toast.success(`${control.title} ${next ? "dibuka" : "ditutup"}`);
  };

  if (!ready || loading) return <AdminLoading />;

  return (
    <AdminShell title="Penutupan Tahapan">
      <Link to="/admin/pengaturan" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-3">
        <ArrowLeft className="size-4" /> Kembali ke Pengaturan
      </Link>

      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 max-w-3xl">
        Perubahan berlaku langsung. Saat ditutup, peserta tidak hanya melihat halaman penutupan tetapi juga ditolak oleh pengaman database jika mencoba mengirim melalui URL atau API secara langsung.
      </div>

      <div className="grid gap-4 max-w-3xl">
        {CONTROLS.map((control) => {
          const Icon = control.icon;
          const isOpen = values[control.field];
          return (
            <div key={control.field} className={`rounded-2xl border bg-card p-5 flex items-center justify-between gap-5 ${isOpen ? "border-emerald/40" : "border-amber-300"}`}>
              <div className="flex items-start gap-3">
                <div className={`size-11 rounded-xl grid place-items-center shrink-0 ${isOpen ? "bg-emerald/10 text-emerald" : "bg-amber-500/10 text-amber-700"}`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <div className="font-semibold">{control.title}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{control.description}</p>
                  <div className={`mt-2 text-xs font-bold ${isOpen ? "text-emerald" : "text-amber-700"}`}>
                    {isOpen ? "DIBUKA — peserta dapat mengirim" : "DITUTUP — pengiriman diblokir"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {saving === control.field && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                <Switch checked={isOpen} onCheckedChange={(next) => toggle(control, next)} disabled={saving !== null} />
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
