import { useEffect, useState } from "react";
import { MessageCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_URL = "https://whatsapp.com/channel/0029VbCxSnICxoAwuDDdCt1Q";

type Variant = "card" | "glass";

export function WhatsAppChannelCTA({
  variant = "card",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const [url, setUrl] = useState<string>(DEFAULT_URL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.rpc("get_wa_channel_url");
        if (!cancelled && typeof data === "string" && data.trim()) setUrl(data.trim());
      } catch {
        /* fall back to default */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (variant === "glass") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 rounded-full glass text-white px-7 py-4 font-medium hover:bg-white/20 ${className}`}
      >
        <MessageCircle className="size-5" /> Gabung Saluran WhatsApp
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block rounded-3xl border border-emerald/30 bg-gradient-to-br from-emerald/10 via-emerald/5 to-accent/5 p-5 sm:p-6 hover-lift ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-2xl bg-emerald text-white grid place-items-center shrink-0 shadow-emerald">
          <MessageCircle className="size-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg font-semibold flex items-center gap-1.5">
            Gabung Saluran WhatsApp
            <ArrowRight className="size-4 opacity-60 group-hover:translate-x-0.5 transition" />
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Dapatkan info terbaru, pengumuman tahapan seleksi, dan pengingat penting
            langsung dari panitia Safar Iman.
          </p>
        </div>
      </div>
    </a>
  );
}
