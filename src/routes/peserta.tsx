import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/peserta")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, follow" },
      { title: "Dashboard Peserta — Safar Iman" },
      {
        name: "description",
        content: "Akses dashboard peserta dan informasi tahapan Safar Iman.",
      },
    ],
  }),
  component: DashboardPesertaPage,
});

// Alamat tujuan disamarkan agar tidak tersimpan sebagai URL terbuka di source.
// Browser tetap menerima URL akhirnya untuk menampilkan halaman melalui iframe.
const EMBED_TARGET = atob(
  "aHR0cHM6Ly9zYWZhcmltYW5ub3RpZi5sb3ZhYmxlLmFwcC9wZXNlcnRh",
);

function DashboardPesertaPage() {
  return (
    <main className="h-dvh w-full overflow-hidden bg-white">
      <iframe
        src={EMBED_TARGET}
        title="Dashboard Peserta Safar Iman"
        className="block h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </main>
  );
}
