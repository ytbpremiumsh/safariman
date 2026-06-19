import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { PesertaTable } from "@/components/admin/PesertaTable";

export const Route = createFileRoute("/admin/peserta/self-funded/pendaftaran")({
  head: () => ({ meta: [{ title: "Pendaftaran Self Funded — Safar Iman Admin" }] }),
  component: () => (
    <AdminShell title="Pendaftaran Self Funded">
      <PesertaTable kind="self_funded" lockDocFilter="registered" />
    </AdminShell>
  ),
});
