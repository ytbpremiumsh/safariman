import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { PesertaTable } from "@/components/admin/PesertaTable";

export const Route = createFileRoute("/admin/peserta/reguler/pendaftaran")({
  head: () => ({ meta: [{ title: "Pendaftaran Reguler — Safar Iman Admin" }] }),
  component: () => (
    <AdminShell title="Pendaftaran Reguler">
      <PesertaTable kind="reguler" lockDocFilter="registered" />
    </AdminShell>
  ),
});
