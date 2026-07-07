import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, HelpCircle, Loader2, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { fetchFaqConfig, type FaqItem } from "@/lib/faq";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () =>
    seoHead({
      path: "/faq",
      title: "FAQ Safar Iman — Pertanyaan Umrah Fully Funded",
      description:
        "Jawaban lengkap seputar pendaftaran, berkas, essay, timeline, benefit, dan kontribusi Program Umrah Safar Iman.",
    }),
  component: FaqPage,
});

function FaqPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FaqItem[]>([]);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("Semua");

  useEffect(() => {
    (async () => {
      const cfg = await fetchFaqConfig();
      if (!cfg.enabled) {
        navigate({ to: "/" });
        return;
      }
      setItems(cfg.items);
      setLoading(false);
    })();
  }, [navigate]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.category && set.add(i.category));
    return ["Semua", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const matchCat = activeCat === "Semua" || it.category === activeCat;
      const matchQ = !q || it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [items, query, activeCat]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-secondary/30">
        <Loader2 className="size-8 animate-spin text-emerald" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Kembali
          </Link>
          <Link to="/pendaftaran" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-emerald text-white px-4 py-1.5 text-xs font-semibold shadow-emerald hover-lift">
            Daftar Sekarang
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 pt-12 sm:pt-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald/10 text-emerald px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
          <HelpCircle className="size-3.5" /> FAQ
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mt-4">
          Pertanyaan <span className="text-gradient-gold">Seputar Safar Iman</span>
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Jawaban lengkap mulai dari pendaftaran, berkas, essay & studi kasus, timeline, benefit,
          hingga kontribusi (add-on benefit).
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 mt-8">
        <div className="relative">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pertanyaan…"
            className="pl-10 h-12 rounded-full bg-card border-border shadow-soft"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={
                "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition " +
                (activeCat === c
                  ? "bg-emerald text-white border-emerald shadow-emerald"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-accent/40")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 mt-8 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">
            Tidak ada pertanyaan yang cocok dengan pencarianmu.
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {filtered.map((it, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="bg-card border border-border rounded-2xl px-5 sm:px-6 shadow-soft data-[state=open]:border-accent/40"
              >
                <AccordionTrigger className="text-left font-display text-base sm:text-lg font-semibold hover:no-underline">
                  <span className="flex-1 pr-3">
                    {it.category && (
                      <span className="mr-2 inline-block text-[10px] font-bold uppercase tracking-wider text-emerald bg-emerald/10 rounded px-1.5 py-0.5 align-middle">
                        {it.category}
                      </span>
                    )}
                    {it.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {it.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center">
          <div className="font-display text-lg font-semibold">Masih ada pertanyaan?</div>
          <p className="text-sm text-muted-foreground mt-1">Hubungi admin Safar Iman lewat WhatsApp atau email yang tertera di halaman utama.</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-emerald text-white px-5 py-2.5 text-sm font-semibold shadow-emerald hover-lift"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </section>
    </div>
  );
}
