import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "./daftar";

export const Route = createFileRoute("/daftar-gelombang-2")({
  head: () => ({
    meta: [
      { title: "Pendaftaran Gelombang 2 — Safar Iman" },
      { name: "description", content: "Pendaftaran jalur Reguler Gelombang 2 Program Safar Iman." },
    ],
  }),
  component: () => <RegisterPage kind="gelombang_2" />,
});
