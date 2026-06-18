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
              <strong> Safar Iman jalur Fully Funded (Gratis)</strong>. Mohon diikuti setiap tahap secara berurutan —
              karena setiap tahap menjadi syarat untuk lanjut ke tahap berikutnya.
            </p>

            <Section title="Tahap 1 — Pendaftaran Online">
              <p><strong>a.</strong> Calon peserta mengisi formulir pendaftaran resmi secara lengkap & jujur melalui:</p>
              <FormLink href={`https://${SITE}/daftar`} label={`${SITE}/daftar`} />
              <p><strong>b.</strong> Setelah berhasil mendaftar, sistem akan menerbitkan <strong>Kode Pendaftaran</strong> unik dengan format <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">HXP-XXXXXXXX</code>. Kode ini wajib disimpan baik-baik karena akan digunakan di seluruh tahap berikutnya.</p>
            </Section>

            <Section title="Tahap 2 — Sosialisasi Twibbon">
              <p><strong>a.</strong> Sebagai bentuk dukungan & sosialisasi program, peserta diwajibkan memasang dan membagikan <strong>Twibbon resmi</strong> Safar Iman di media sosial pribadi.</p>
              <p><strong>b.</strong> Frame twibbon dapat diunduh melalui:</p>
              <FormLink href={`https://${SITE}/twibbon`} label={`${SITE}/twibbon`} />
              <p><strong>c.</strong> Pastikan akun media sosial tidak dikunci agar tim verifikasi dapat memeriksa unggahan peserta.</p>
            </Section>

            <Section title="Tahap 3 — Kelengkapan Berkas Administrasi">
              <p><strong>a.</strong> Peserta melengkapi berkas administrasi berupa <strong>CV terbaru</strong> (format PDF, maksimal 2MB) dan <strong>pas foto formal</strong>.</p>
              <p><strong>b.</strong> Upload berkas melalui halaman:</p>
              <FormLink href={`https://${SITE}/berkas`} label={`${SITE}/berkas`} />
              <p><strong>c.</strong> Berkas yang tidak lengkap atau tidak memenuhi ketentuan akan dianggap gugur secara administratif.</p>
            </Section>

            <Section title="Tahap 4 — Kontribusi Keberkahan">
              <p>
                Setiap peserta Safar Iman berkomitmen menunaikan <strong>kontribusi keberkahan</strong> sebagai bentuk ikhtiar batin dan dukungan terhadap program dakwah di Tanah Suci. Dana ini dikelola secara amanah dan transparan untuk:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Wakaf Al-Qur'an</strong> — wakaf mushaf di Makkah dan Madinah sebagai amal jariyah.</li>
                <li><strong>Berbagi Makanan</strong> — menjangkau saudara yang membutuhkan di Makkah dan Madinah.</li>
                <li><strong>Kegiatan Safar Iman</strong> — mendukung keberlangsungan program dan dakwah bersama.</li>
              </ul>

              <p className="mt-3">
                Seluruh peserta yang berkontribusi otomatis mendapatkan <strong>akses eksklusif</strong> ke:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Kelas Online:</strong> Fiqh Umrah Praktis — panduan lengkap manasik umrah dari persiapan hingga pulang.</li>
                <li><strong>Kajian Sirah:</strong> Jejak Cahaya: Makkah dan Madinah — menelusuri lintasan sejarah Nabi ﷻ di dua kota suci.</li>
                <li><strong>E-Sertifikat Resmi</strong> setelah menyelesaikan kelas.</li>
                <li><strong>Akses Rekaman</strong> materi untuk ditonton ulang kapan saja.</li>
              </ul>

              <p className="mt-3"><strong>Kelengkapan kontribusi</strong> menjadi syarat administrasi untuk melanjutkan ke tahap seleksi berikutnya.</p>
              <FormLink href={`https://${SITE}/donasi`} label={`${SITE}/donasi`} />
            </Section>

            <Section title="Tahap 5 — Seleksi Essay">
              <p><strong>a.</strong> Peserta yang telah melengkapi seluruh berkas administrasi berhak melanjutkan ke tahap <strong>Seleksi Essay</strong>.</p>
              <p><strong>b.</strong> Essay dikerjakan secara online melalui:</p>
              <FormLink href={`https://${SITE}/essay`} label={`${SITE}/essay`} />
              <p><strong>c.</strong> Mohon dikerjakan dengan jujur, reflektif, dan menggunakan bahasa sendiri. Hasil verifikasi essay akan diumumkan dalam <strong>1–3 hari kerja</strong>.</p>
              <p><strong>d.</strong> Hasil seleksi dapat dicek mandiri di:</p>
              <FormLink href={`https://${SITE}/cek-hasil`} label={`${SITE}/cek-hasil`} />
            </Section>

            <Section title="Tahap 6 — TKA (Tes Kesiapan Awal)">
              <p><strong>a.</strong> Peserta yang lolos seleksi essay akan diundang mengikuti <strong>Tes Kesiapan Awal (TKA)</strong> berbasis CBT online.</p>
              <p><strong>b.</strong> Link tes & token akses dikirim melalui <strong>WhatsApp resmi</strong> Safar Iman sesuai jadwal.</p>
              <p><strong>c.</strong> Materi tes mencakup: pengetahuan keislaman dasar, motivasi & komitmen ibadah, serta wawasan seputar manasik dan umrah.</p>
              <p><strong>d.</strong> Durasi pengerjaan <strong>± 60–90 menit</strong>, hasil tercatat otomatis di sistem.</p>
            </Section>

            <Section title="Tahap 7 — Wawancara Final">
              <p><strong>a.</strong> Peserta yang lolos TKA akan diundang ke sesi <strong>wawancara final secara online</strong> bersama tim seleksi Safar Iman.</p>
              <p><strong>b.</strong> Wawancara dilakukan via <strong>panggilan WhatsApp / telepon seluler</strong> sesuai jadwal yang dikonfirmasi sebelumnya.</p>
              <p><strong>c.</strong> Aspek yang dinilai: ketulusan niat ibadah, motivasi, komitmen, serta kesiapan mental & pendukung selama perjalanan umrah.</p>
            </Section>

            <Section title="Tahap 8 — Pengumuman Final & Penerimaan">
              <p>
                <strong>a.</strong> Hasil akhir penerimaan diumumkan resmi melalui WhatsApp & email,
                serta dapat dicek mandiri di <FormLink inline href={`https://${SITE}/cek-hasil`} label={`${SITE}/cek-hasil`} />.
              </p>
              <p>
                <strong>b.</strong> Peserta yang diterima akan menerima <strong>Letter of Acceptance (LOA)</strong> resmi
                beserta jadwal manasik dan briefing pra-keberangkatan.
              </p>
              <p>
                <strong>c.</strong> Jalur Fully Funded Safar Iman <strong>100% GRATIS</strong> — seluruh biaya perjalanan umrah ditanggung penuh oleh program. Kontribusi keberkahan pada Tahap 4 merupakan syarat administrasi untuk akses eksklusif dan kelanjutan seleksi, bukan biaya perjalanan.
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
