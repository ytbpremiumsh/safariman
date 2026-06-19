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
              Berikut adalah <strong>alur lengkap & bertahap</strong> bagi calon peserta program
              <strong> Safar Iman jalur Fully Funded (Gratis)</strong>, disusun selaras dengan
              <em> Timeline Alur Pendaftaran Fully Funded</em> resmi. Mohon diikuti setiap tahap
              secara berurutan — karena setiap tahap menjadi syarat untuk lanjut ke tahap berikutnya.
            </p>

            <Section title="Tahap 1 — Pendaftaran Online">
              <p><strong>a.</strong> Calon peserta mengisi formulir pendaftaran jalur Reguler (Fully Funded) secara <strong>gratis</strong> dengan data diri lengkap: nama, email, WhatsApp, gender, tempat & tanggal lahir, kota, pendidikan, pekerjaan, dan Instagram.</p>
              <p><strong>b.</strong> Akses formulir melalui:</p>
              <FormLink href={`https://${SITE}/daftar`} label={`${SITE}/daftar`} />
              <p><strong>c.</strong> Setelah berhasil mendaftar, sistem menerbitkan <strong>Kode Pendaftaran</strong> unik berformat <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">HXP-XXXXXXXX</code>. Kode ini wajib disimpan karena akan digunakan di seluruh tahap berikutnya. Status awal peserta: <em>pending</em>.</p>
              <p className="text-xs text-muted-foreground">Estimasi waktu: ± 5 menit.</p>
            </Section>

            <Section title="Tahap 2 — Bagikan Twibbon">
              <p><strong>a.</strong> Peserta wajib mengunduh frame twibbon resmi, memasang foto pribadi, lalu mengunggahnya ke Instagram sambil menandai akun resmi Safar Iman.</p>
              <p><strong>b.</strong> Wajib pula <strong>follow</strong> akun media sosial Safar Iman dan memastikan akun tidak dikunci agar tim verifikasi dapat memeriksa unggahan.</p>
              <p><strong>c.</strong> Download frame twibbon di:</p>
              <FormLink href={`https://${SITE}/twibbon`} label={`${SITE}/twibbon`} />
              <p className="text-xs text-muted-foreground">Estimasi waktu: ± 10 menit.</p>
            </Section>

            <Section title="Tahap 3 — Kirim Berkas">
              <p><strong>a.</strong> Peserta login menggunakan Kode Pendaftaran lalu mengunggah <strong>CV</strong> (PDF, maks. 2MB) dan <strong>pas foto formal</strong> (JPG/PNG).</p>
              <p><strong>b.</strong> Akses halaman upload berkas di:</p>
              <FormLink href={`https://${SITE}/berkas`} label={`${SITE}/berkas`} />
              <p><strong>c.</strong> Berkas tidak lengkap / tidak memenuhi ketentuan akan dianggap gugur secara administratif.</p>
              <p className="text-xs text-muted-foreground">Estimasi waktu: ± 5 menit.</p>
            </Section>

            <Section title="Tahap 4 — Pengerjaan Essay">
              <p><strong>a.</strong> Peserta mengisi <strong>3 essay wajib</strong> sebagai bahan utama pertimbangan seleksi:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li><strong>Essay 1:</strong> Mengapa kamu layak terpilih?</li>
                <li><strong>Essay 2:</strong> Apa mimpi & target setelah umrah?</li>
                <li><strong>Essay 3:</strong> Kontribusi apa yang akan kamu berikan?</li>
              </ul>
              <p className="mt-2"><strong>b.</strong> Akses halaman pengerjaan essay di:</p>
              <FormLink href={`https://${SITE}/essay`} label={`${SITE}/essay`} />
              <p><strong>c.</strong> Kerjakan dengan jujur, reflektif, dan menggunakan bahasa sendiri. Setelah submit, status peserta otomatis berubah ke tahap verifikasi.</p>
              <p className="text-xs text-muted-foreground">Estimasi waktu: ± 30–60 menit.</p>
            </Section>

            <Section title="Tahap 5 — Verifikasi Berkas & Essay">
              <p><strong>a.</strong> Tim Safar Iman memeriksa kelengkapan berkas administrasi serta kualitas dan keaslian essay peserta.</p>
              <p><strong>b.</strong> Peserta yang lolos verifikasi berhak melanjutkan ke tahap pengumuman & TKA. Yang tidak memenuhi standar akan ditandai gugur.</p>
              <p className="text-xs text-muted-foreground">Estimasi waktu: 1–3 hari kerja.</p>
            </Section>

            <Section title="Tahap 6 — Pengumuman Lolos Essay">
              <p><strong>a.</strong> Hasil seleksi essay diumumkan resmi dan dapat dicek mandiri oleh peserta menggunakan Kode Pendaftaran di:</p>
              <FormLink href={`https://${SITE}/cek-hasil`} label={`${SITE}/cek-hasil`} />
              <p><strong>b.</strong> Notifikasi <strong>WhatsApp otomatis</strong> dikirim ke peserta yang lolos. Peserta lolos berhak lanjut ke <strong>TKA (Tes Kesiapan Awal)</strong>.</p>
              <p className="text-xs text-muted-foreground">Estimasi waktu: 1 hari.</p>
            </Section>

            <Section title="Tahap 7 — TKA (Tes Kesiapan Awal)">
              <p><strong>a.</strong> Peserta mengikuti <strong>TKA berbasis CBT online</strong> untuk mengukur kesiapan mental & pengetahuan dasar.</p>
              <p><strong>b.</strong> Link tes & token akses dikirim melalui <strong>WhatsApp resmi</strong> Safar Iman sesuai jadwal.</p>
              <p><strong>c.</strong> Materi tes: keislaman dasar, motivasi & komitmen ibadah, serta wawasan seputar manasik dan umrah. Soal berbentuk pilihan ganda dengan batas waktu.</p>
              <p className="text-xs text-muted-foreground">Estimasi waktu: ± 60–90 menit.</p>
            </Section>

            <Section title="Tahap 8 — Wawancara Final">
              <p><strong>a.</strong> Peserta yang lolos TKA diundang ke sesi <strong>wawancara final 1-on-1</strong> bersama tim seleksi Safar Iman.</p>
              <p><strong>b.</strong> Jadwal wawancara dikirim via <strong>WhatsApp</strong>; wawancara dilakukan melalui panggilan WhatsApp / telepon seluler.</p>
              <p><strong>c.</strong> Aspek yang dinilai: motivasi, komitmen, kesiapan finansial pendukung, ketulusan niat ibadah, serta kesiapan mental selama perjalanan.</p>
              <p className="text-xs text-muted-foreground">Estimasi waktu: ± 30–45 menit.</p>
            </Section>

            <Section title="Tahap 9 — Pengumuman Final & Penerimaan">
              <p><strong>a.</strong> Pengumuman peserta yang resmi diterima sebagai <strong>penerima manfaat Umrah Gratis Safar Iman</strong> dirilis melalui WhatsApp & email otomatis, serta dapat dicek mandiri di <FormLink inline href={`https://${SITE}/cek-hasil`} label={`${SITE}/cek-hasil`} />.</p>
              <p><strong>b.</strong> Peserta yang diterima menerima <strong>Letter of Acceptance (LOA)</strong> resmi beserta jadwal manasik & briefing pra-keberangkatan.</p>
              <p><strong>c.</strong> Jalur Fully Funded Safar Iman <strong>100% GRATIS</strong> — seluruh biaya perjalanan umrah ditanggung penuh oleh program.</p>
              <p className="text-xs text-muted-foreground">Estimasi waktu: 1 hari.</p>
            </Section>

            <Section title="Tahap 10 — Keberangkatan Umrah">
              <p><strong>a.</strong> Peserta terpilih mengikuti <strong>manasik & briefing akhir</strong>, kemudian berkumpul di titik keberangkatan sesuai jadwal.</p>
              <p><strong>b.</strong> Menunaikan ibadah <strong>umrah penuh berkah</strong> bersama Safar Iman dengan pendampingan muthawif profesional.</p>
              <p><strong>c.</strong> Pelaporan & dokumentasi pasca-umrah dilakukan sebagai bentuk syukur dan bahan inspirasi calon peserta berikutnya.</p>
              <p className="text-xs text-muted-foreground">Estimasi durasi perjalanan: ± 9–12 hari.</p>
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
