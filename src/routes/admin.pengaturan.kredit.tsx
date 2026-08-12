import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, useAdminGuard } from "@/components/AdminShell";
import { FeatureToggles } from "@/components/admin/FeatureToggles";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/admin/pengaturan/kredit")({
  head: () => ({ meta: [{ title: "Kontrol Kredit — Safar Iman" }] }),
  component: KreditControlPage,
});

function KreditControlPage() {
  const ready = useAdminGuard();

  if (!ready) return null;

  return (
    <AdminShell title="Kontrol Fitur Kredit">
      <div className="max-w-4xl">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 mb-6 flex gap-4">
          <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900/50 grid place-items-center shrink-0">
            <CreditCard className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Informasi Pemakaian Kredit</h3>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/70 mt-1 leading-relaxed">
              Beberapa fitur aplikasi menggunakan AI dan Edge Functions yang mengonsumsi kredit platform. 
              Gunakan halaman ini untuk mematikan fitur tersebut saat sedang tidak digunakan (misal: saat tahap pendaftaran selesai) 
              untuk menghemat kuota kredit Anda.
            </p>
          </div>
        </div>

        <FeatureToggles />
      </div>
    </AdminShell>
  );
}
