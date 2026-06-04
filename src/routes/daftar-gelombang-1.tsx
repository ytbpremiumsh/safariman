import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "./daftar";

export const Route = createFileRoute("/daftar-gelombang-1")({
  head: () => ({
    meta: [
      { title: "Pendaftaran Gelombang 1 — Safar Iman" },
      { name: "description", content: "Pendaftaran jalur Reguler Gelombang 1 Program Safar Iman." },
    ],
  }),
  component: () => <RegisterPage kind="gelombang_1" />,
});
