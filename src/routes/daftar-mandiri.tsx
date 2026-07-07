import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "./daftar";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/daftar-mandiri")({
  head: () =>
    seoHead({
      path: "/daftar-mandiri",
      title: "Umrah Jalur Mandiri (Self Funded) — Safar Iman",
      description:
        "Ikuti Program Umrah Safar Iman via jalur Mandiri (Self Funded) dengan pengalaman, fasilitas, dan bimbingan yang sama seperti jalur Fully Funded.",
    }),
  component: () => <RegisterPage kind="self_funded" />,
});
