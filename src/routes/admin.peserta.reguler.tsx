import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { PesertaTable } from "@/components/admin/PesertaTable";

export const Route = createFileRoute("/admin/peserta/reguler")({
  head: () => ({ meta: [{ title: "Peserta Reguler — Safar Iman Admin" }] }),
  component: () => (
    <AdminShell title="Peserta Reguler (Fully / Partial Funded)">
      <PesertaTable kind="reguler" />
    </AdminShell>
  ),
});
