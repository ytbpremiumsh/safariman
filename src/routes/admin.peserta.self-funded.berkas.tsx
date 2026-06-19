import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { PesertaTable } from "@/components/admin/PesertaTable";

export const Route = createFileRoute("/admin/peserta/self-funded/berkas")({
  head: () => ({ meta: [{ title: "Berkas Self Funded — Safar Iman Admin" }] }),
  component: () => (
    <AdminShell title="Sudah Kirim Berkas — Self Funded">
      <PesertaTable kind="self_funded" lockDocFilter="submitted" />
    </AdminShell>
  ),
});
