import { createFileRoute, Link } from "@tanstack/react-router";
import { MailX } from "lucide-react";
import logoSafarIman from "@/assets/logo-safar-iman.png";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, follow" },{ title: "Berhenti Berlangganan Email — Safar Iman" }] }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-secondary/30 grid place-items-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 text-center">
        <Link to="/" className="inline-block mb-5">
          <img src={logoSafarIman} alt="Safar Iman" className="h-10 w-auto mx-auto" />
        </Link>

        <div className="size-14 rounded-full bg-amber-500/10 grid place-items-center mx-auto mb-3">
          <MailX className="size-7 text-amber-600" />
        </div>
        <h1 className="font-display text-xl font-semibold mb-2">Berhenti berlangganan email</h1>
        <p className="text-sm text-muted-foreground">
          Untuk berhenti menerima email dari Safar Iman, gunakan tautan
          “Unsubscribe” yang ada di bagian bawah email terakhir yang kamu terima.
          Permintaan akan langsung diproses dari tautan tersebut.
        </p>

        <div className="mt-6">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Kembali ke beranda</Link>
        </div>
      </div>
    </div>
  );
}
