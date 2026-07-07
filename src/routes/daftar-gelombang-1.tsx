import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "./daftar";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/daftar-gelombang-1")({
  head: () =>
    seoHead({
      path: "/daftar-gelombang-1",
      title: "Pendaftaran Umrah Gelombang 1 — Safar Iman",
      description:
        "Daftar Umrah Safar Iman Gelombang 1. Kesempatan Umrah Fully Funded untuk pemuda Indonesia. Isi formulir dan ikuti tahapan seleksi.",
    }),
  component: () => <RegisterPage kind="gelombang_1" />,
});
