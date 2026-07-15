import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/panduan")({
  head: () => ({
    meta: [
      { title: "Panduan Program Safar Iman" },
      { name: "description", content: "Panduan lengkap Program Safar Iman — Umrah Fully Funded untuk anak muda Indonesia." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PanduanViewer,
});

function toEmbedUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // Google Drive: convert /file/d/<id>/view -> /file/d/<id>/preview (no download button)
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (u.hostname.includes("drive.google.com") && m) {
      return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
    // Direct PDF: append viewer params to hide toolbar/download in most browsers
    if (/\.pdf($|\?)/i.test(u.pathname + u.search)) {
      const hash = "#toolbar=0&navpanes=0&scrollbar=0";
      return raw.split("#")[0] + hash;
    }
    return raw;
  } catch {
    return raw;
  }
}

function PanduanViewer() {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_panduan_url");
      if (data && typeof data === "string" && data.trim()) {
        setUrl(toEmbedUrl(data.trim()));
      }
      setLoading(false);
    })();
  }, []);

  // Best-effort: block common download shortcuts on this page
  useEffect(() => {
    const onCtx = (e: MouseEvent) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p")) e.preventDefault();
    };
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Kembali
          </Link>
          <div className="font-display font-semibold">Panduan Program</div>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 relative select-none">
        {loading ? (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : url ? (
          <>
            <iframe
              src={url}
              title="Panduan Program Safar Iman"
              className="w-full h-[calc(100vh-3.5rem)] border-0"
              allow="autoplay"
              // sandbox helps prevent top-nav; omit allow-downloads deliberately
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
            {/* Overlay strip to cover any residual toolbar/download UI in some viewers */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-14 right-0 h-10 w-40 bg-transparent"
            />
          </>
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Panduan belum tersedia.
          </div>
        )}
      </main>
    </div>
  );
}
