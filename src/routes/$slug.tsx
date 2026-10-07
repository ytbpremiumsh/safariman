import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoSafarIman from "@/assets/logo-safar-iman.png";
import { reservedSlugs, validDestination } from "@/lib/short-links";

export const Route = createFileRoute("/$slug")({
  head: () => ({ meta: [{ title: "Mengalihkan Link — Safar Iman" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ShortLinkRedirect,
});

function ShortLinkRedirect() {
  const { slug } = Route.useParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    (async () => {
      try {
      if (reservedSlugs.has(slug.toLowerCase())) {
        setError("Alamat ini bukan shortlink.");
        return;
      }
      const { data, error: queryError } = await supabase
        .from("short_links")
        .select("target_url")
        .eq("slug", slug.toLowerCase())
        .eq("is_active", true)
        .abortSignal(controller.signal)
        .maybeSingle();

      if (cancelled) return;
      if (queryError) {
        setError("Koneksi gagal. Silakan muat ulang halaman untuk mencoba lagi.");
        return;
      }
      if (!data?.target_url) {
        setError("Shortlink tidak ditemukan atau sedang dinonaktifkan.");
        return;
      }

      try {
        const destination = new URL(data.target_url);
        if (!validDestination(data.target_url, slug)) {
          throw new Error("Protokol URL tidak didukung");
        }
        window.location.replace(destination.toString());
      } catch {
        setError("Tujuan shortlink tidak valid.");
      }
      } catch {
        if (!cancelled) setError("Koneksi gagal. Silakan muat ulang halaman.");
      } finally {
        window.clearTimeout(timeout);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [slug]);

  return (
    <main className="min-h-screen bg-[#f8f3e8] grid place-items-center px-5">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
        <img src={logoSafarIman} alt="Safar Iman" className="mx-auto h-14 w-auto" />
        {error ? (
          <>
            <div className="mx-auto mt-7 grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
              <ExternalLink className="size-6" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-semibold">Link tidak tersedia</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error}</p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-gradient-emerald px-6 py-3 text-sm font-semibold text-white">
              Kembali ke Beranda
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mt-8 size-9 animate-spin text-emerald" />
            <h1 className="mt-5 font-display text-2xl font-semibold">Mengarahkan Anda</h1>
            <p className="mt-2 text-sm text-muted-foreground">Mohon tunggu sebentar…</p>
          </>
        )}
      </section>
    </main>
  );
}
