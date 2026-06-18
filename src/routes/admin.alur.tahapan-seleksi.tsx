import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { MousePointerClick, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/alur/tahapan-seleksi")({
  head: () => ({ meta: [{ title: "Tahapan Seleksi Fully Funded — Safar Iman Admin" }] }),
  component: TahapanSeleksiPage,
});

const SITE = "www.safariman.id";

function TahapanSeleksiPage() {
  const ready = useAdminGuard();
  const [copied, setCopied] = useState(false);
  if (!ready) return <AdminLoading />;

  const handleCopy = async () => {
    const text = document.getElementById("tahapan-seleksi-doc")?.innerText ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminShell title="Tahapan Seleksi Fully Funded">
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Halaman referensi resmi tahapan seleksi jalur Fully Funded Safar Iman.
          Gaya dokumen ini dapat disalin & dibagikan ke calon peserta sebagai poster/caption sosial media.
        </p>
        <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2">
          {copied ? <Check className="size-4 text-emerald" /> : <Copy className="size-4" />}
          {copied ? "Tersalin" : "Salin Teks"}
        </Button>
      </div>

      <div className="relative rounded-3xl border-2 border-accent/40 bg-gradient-to-br from-amber-50/60 via-background to-emerald/5 shadow-soft overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, hsl(var(--accent)) 0, transparent 40%), radial-gradient(circle at 80% 90%, hsl(var(--emerald)) 0, transparent 45%)",
          }}
        />

        <div className="relative px-6 sm:px-12 py-10 sm:py-14">
          <div className="text-center mb-10">
            <div className="text-[11px] sm:text-xs font-bold tracking-[0.32em] uppercase text-accent mb-2">
              Tahapan Seleksi Fully Funded
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-accent to-emerald-deep bg-clip-text text-transparent">
              Safar Iman
            </h2>
            <div className="mt-3 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
          </div>

          <div id="tahapan-seleksi-doc" className="space-y-6 text-[15px] leading-relaxed text-foreground/85 max-w-3xl mx-auto">
            <p>
              Proses pendaftaran <strong>Safar Iman jalur Fully Funded (Gratis)</strong> peserta akan
              melewati <strong>4 tahap seleksi</strong> berikut:
            </p>

            <Section title="1. Seleksi Tahap 1 (Berkas & Administrasi)">
              <p><strong>a.</strong> Peserta melakukan pendaftaran online dan mengisi data diri secara lengkap melalui formulir resmi;</p>
              <FormLink href={`https://${SITE}/daftar`} label={`${SITE}/daftar`} />
              <p><strong>b.</strong> Setelah mendaftar, peserta akan menerima <strong>Kode Pendaftaran</strong> unik (format <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">HXP-XXXXXXXX</code>) yang digunakan untuk seluruh tahap berikutnya.</p>
              <p><strong>c.</strong> Peserta wajib membagikan <strong>Twibbon resmi</strong> Safar Iman di media sosial sebagai bentuk sosialisasi program;</p>
              <FormLink href={`https://${SITE}/twibbon`} label={`${SITE}/twibbon`} />
              <p><strong>d.</strong> Peserta melengkapi berkas administrasi (CV format PDF maks. 2MB dan pas foto formal) melalui:</p>
              <FormLink href={`https://${SITE}/berkas`} label={`${SITE}/berkas`} />
            </Section>

            <Section title="2. Seleksi Tahap 2 (Essay)">
              <p><strong>a.</strong> Peserta yang dinyatakan lolos seleksi administrasi akan melanjutkan ke tahap pengerjaan <strong>Essay Seleksi</strong>.</p>
              <p><strong>b.</strong> Essay terdiri dari <strong>3 pertanyaan wajib</strong> yang dikerjakan via formulir online:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Alasan mengapa Anda layak menjadi penerima manfaat program.</li>
                <li>Mimpi & target yang ingin dicapai setelah menunaikan umrah.</li>
                <li>Kontribusi nyata yang akan Anda berikan setelah pulang.</li>
              </ul>
              <p><strong>c.</strong> Essay dikerjakan melalui:</p>
              <FormLink href={`https://${SITE}/essay`} label={`${SITE}/essay`} />
              <p><strong>d.</strong> Tim seleksi akan memverifikasi essay dan berkas dalam waktu <strong>1–3 hari kerja</strong>. Hasil pengumuman lolos essay dapat dicek di:</p>
              <FormLink href={`https://${SITE}/cek-hasil`} label={`${SITE}/cek-hasil`} />
              <p>Notifikasi resmi akan dikirim otomatis melalui <strong>WhatsApp</strong> kepada peserta yang lolos.</p>
            </Section>

            <Section title="3. Seleksi Tahap 3 (TKA — Tes Kesiapan Awal)">
              <p><strong>a.</strong> Peserta lolos essay berhak mengikuti <strong>Tes Kesiapan Awal (TKA)</strong> berbasis CBT online.</p>
              <p><strong>b.</strong> Link tes dan token akses akan dikirimkan melalui WhatsApp ke nomor peserta.</p>
              <p><strong>c.</strong> Materi TKA meliputi:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Pengetahuan keislaman dasar</li>
                <li>Motivasi & komitmen ibadah</li>
                <li>Wawasan seputar manasik & umrah</li>
              </ul>
              <p><strong>d.</strong> Tes berbasis waktu dengan durasi pengerjaan <strong>± 60–90 menit</strong>. Hasil tercatat otomatis di sistem.</p>
            </Section>

            <Section title="4. Seleksi Tahap 4 (Wawancara Final)">
              <p>
                Peserta yang dinyatakan lolos TKA akan melanjutkan ke sesi <strong>wawancara final secara online</strong>.
                Wawancara dilakukan via <strong>panggilan WhatsApp / telepon seluler</strong> bersama tim seleksi Safar Iman.
              </p>
              <p>Aspek penilaian wawancara meliputi: motivasi, komitmen ibadah, kesiapan mental & pendukung, serta niat ibadah peserta.</p>
            </Section>

            <Section title="Pengumuman Final & Penerimaan">
              <p>
                <strong>a.</strong> Hasil akhir penerimaan diumumkan resmi melalui WhatsApp, email,
                dan dapat dicek mandiri di <FormLink inline href={`https://${SITE}/cek-hasil`} label={`${SITE}/cek-hasil`} />.
              </p>
              <p>
                <strong>b.</strong> Peserta diterima akan menerima <strong>Letter of Acceptance (LOA)</strong> resmi
                serta jadwal manasik dan briefing pra-keberangkatan.
              </p>
              <p>
                <strong>c.</strong> Jalur Fully Funded Safar Iman <strong>100% GRATIS</strong> —
                tidak dipungut biaya pendaftaran maupun donasi wajib pada tahap manapun.
              </p>
            </Section>

            <div className="mt-8 pt-6 border-t border-border/60 text-center">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Safar Iman · Program Umrah Penuh Berkah
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <h3 className="font-display text-lg sm:text-xl font-bold text-emerald-deep">{title}</h3>
      <div className="space-y-2 pl-1">{children}</div>
    </div>
  );
}

function FormLink({ href, label, inline = false }: { href: string; label: string; inline?: boolean }) {
  const link = (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 align-middle"
    >
      <span className="font-bold text-accent underline underline-offset-2 decoration-accent/40">
        {label}
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-gradient-gold text-emerald-deep px-2 py-0.5 rounded-full shadow-soft">
        <MousePointerClick className="size-3" />
        Klik di Link
      </span>
    </a>
  );
  if (inline) return link;
  return <p className="pl-5">o Isi Formulir : {link}</p>;
}
