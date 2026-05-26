import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { PesertaTable } from "@/components/admin/PesertaTable";

export const Route = createFileRoute("/admin/peserta/self-funded")({
  head: () => ({ meta: [{ title: "Peserta Self Funded — Safar Iman Admin" }] }),
  component: () => (
    <AdminShell title="Peserta Self Funded">
      <PesertaTable kind="self_funded" />
    </AdminShell>
  ),
});
