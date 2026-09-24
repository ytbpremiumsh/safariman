import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cek-pengumuman")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, follow" },
      { title: "Cek Pengumuman — Safar Iman" },
      {
        name: "description",
        content: "Cek pengumuman hasil seleksi Essay dan Studi Kasus Safar Iman.",
      },
    ],
  }),
  component: CekPengumumanPage,
});

// Alamat tujuan disamarkan agar tidak tersimpan sebagai URL terbuka di source.
// Browser tetap harus menerima URL akhirnya agar dapat memuat iframe.
const EMBED_TARGET = atob("aHR0cHM6Ly9zYWZhcmltYW5ub3RpZi5sb3ZhYmxlLmFwcA==");

function CekPengumumanPage() {
  return (
    <main className="h-dvh w-full overflow-hidden bg-white">
      <iframe
        src={EMBED_TARGET}
        title="Pengumuman Tahap Seleksi Essay dan Studi Kasus"
        className="block h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </main>
  );
}
