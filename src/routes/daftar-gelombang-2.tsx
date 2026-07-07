import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "./daftar";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/daftar-gelombang-2")({
  head: () =>
    seoHead({
      path: "/daftar-gelombang-2",
      title: "Pendaftaran Umrah Gelombang 2 — Safar Iman",
      description:
        "Daftar Umrah Safar Iman Gelombang 2. Kesempatan kedua bagi pemuda Indonesia untuk Umrah Fully Funded bersama Safar Iman.",
    }),
  component: () => <RegisterPage kind="gelombang_2" />,
});
