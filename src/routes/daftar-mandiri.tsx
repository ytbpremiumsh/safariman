import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "./daftar";

export const Route = createFileRoute("/daftar-mandiri")({
  head: () => ({
    meta: [
      { title: "Pendaftaran Self Funded — Safar Iman" },
      { name: "description", content: "Pendaftaran jalur mandiri (Self Funded) Program Safar Iman." },
    ],
  }),
  component: () => <RegisterPage kind="self_funded" />,
});
