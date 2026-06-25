import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { PesertaTable } from "@/components/admin/PesertaTable";
import { PublishHasilToggle } from "@/components/admin/PublishHasilToggle";

export const Route = createFileRoute("/admin/peserta/reguler/berkas")({
  head: () => ({ meta: [{ title: "Berkas Reguler — Safar Iman Admin" }] }),
  component: () => (
    <AdminShell title="Sudah Kirim Berkas — Reguler">
      <PublishHasilToggle
        settingKey="berkas_results_published"
        label="Berkas (Seleksi Administrasi)"
      />
      <PesertaTable kind="reguler" lockDocFilter="submitted" />
    </AdminShell>
  ),
});
