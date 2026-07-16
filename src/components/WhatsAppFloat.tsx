import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/6287777834426?text=Halo%20Safar%20Iman%2C%20saya%20ingin%20bertanya%20tentang%20program."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Hubungi via WhatsApp"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald animate-glow-pulse" />
        <div className="relative bg-gradient-emerald text-white rounded-full p-4 shadow-emerald hover-lift flex items-center gap-2 pr-5">
          <MessageCircle className="size-6" />
          <span className="hidden sm:inline text-sm font-medium">Tanya Kami</span>
        </div>
      </div>
    </a>
  );
}
