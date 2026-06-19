import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { PesertaTable } from "@/components/admin/PesertaTable";

export const Route = createFileRoute("/admin/peserta/reguler/berkas")({
  head: () => ({ meta: [{ title: "Berkas Reguler — Safar Iman Admin" }] }),
  component: () => (
    <AdminShell title="Sudah Kirim Berkas — Reguler">
      <PesertaTable kind="reguler" lockDocFilter="submitted" />
    </AdminShell>
  ),
});
