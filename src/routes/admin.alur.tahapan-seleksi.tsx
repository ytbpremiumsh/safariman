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
              Berikut adalah <strong>4 tahapan seleksi</strong> yang harus dilewati calon peserta program
              <strong> Safar Iman jalur Fully Funded</strong>. Setiap tahap bersifat berurutan dan menjadi
              syarat untuk dapat lanjut ke tahap berikutnya. Pastikan calon peserta memahami alur ini sejak awal.
            </p>

            <Section title="1. Tahapan Berkas Administrasi">
              <p><strong>a.</strong> Setelah melakukan pendaftaran online di <FormLink inline href={`https://${SITE}/daftar`} label={`${SITE}/daftar`} />, peserta akan menerima <strong>Kode Pendaftaran</strong> unik berformat <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">HXP-XXXXXXXX</code>.</p>
              <p><strong>b.</strong> Peserta login menggunakan kode tersebut untuk mengunggah berkas administrasi wajib di:</p>
              <FormLink href={`https://${SITE}/berkas`} label={`${SITE}/berkas`} />
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li><strong>CV</strong> dalam format PDF (maks. 2MB).</li>
                <li><strong>Pas foto formal</strong> terbaru dalam format JPG/PNG.</li>
                <li>Data diri lengkap dan dapat dipertanggungjawabkan.</li>
              </ul>
              <p><strong>c.</strong> Tim Safar Iman akan melakukan verifikasi kelengkapan dan keabsahan berkas. Hasilnya akan diumumkan dalam waktu <strong>1–3 hari kerja</strong>. Peserta yang <strong>lolos</strong> berkas administrasi berhak melanjutkan ke tahap Kontribusi/Donasi.</p>
              <p><strong>d.</strong> Peserta dapat mengecek status kelulusan berkas di <FormLink inline href={`https://${SITE}/cek-hasil`} label={`${SITE}/cek-hasil`} /> atau melalui notifikasi WhatsApp resmi Safar Iman.</p>
              <p className="text-xs text-muted-foreground">Estimasi waktu pengerjaan: ± 5 menit · Estimasi verifikasi: 1–3 hari kerja.</p>
            </Section>

            <Section title="2. Tahapan Kontribusi / Donasi">
              <p><strong>a.</strong> Tahap ini <strong>hanya diikuti oleh peserta yang dinyatakan lolos seleksi berkas administrasi</strong>. Peserta wajib menunaikan kontribusi/kontribusi sebesar <strong>Rp. 100.000</strong> melalui halaman resmi:</p>
              <FormLink href={`https://${SITE}/kontribusi`} label={`${SITE}/kontribusi`} />
              <p>Pembayaran diproses secara otomatis oleh <strong>Mayar</strong> dengan jaminan keamanan SSL. Peserta cukup memasukkan <strong>Kode Pendaftaran</strong>, lalu mengikuti instruksi pembayaran yang tersedia.</p>
              <p><strong>b.</strong> Donasi yang dibayarkan akan digunakan untuk mendukung beberapa kegiatan sosial:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li><strong>Wakaf Al-Qur'an:</strong> Wakaf mushaf di Makkah dan Madinah sebagai amal jariyah.</li>
                <li><strong>Berbagi Makanan:</strong> Menjangkau saudara yang membutuhkan di Makkah dan Madinah.</li>
                <li><strong>Kegiatan Safar Iman:</strong> Mendukung keberlangsungan program dan operasional kebaikan bersama.</li>
              </ul>

              <div className="mt-5 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/8 via-emerald/5 to-background p-5 sm:p-6">
                <div className="flex flex-col items-start gap-3">
                  <span className="inline-flex items-center rounded-full bg-gradient-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-deep shadow-soft">
                    Apresiasi Peserta — Sudah Termasuk
                  </span>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-emerald-deep leading-tight">
                    Sebagai bentuk apresiasi, peserta akan mendapatkan kesempatan mengikuti Kelas Online & Kajian Sirah
                  </h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Seluruh peserta yang berkontribusi mendapatkan akses Eksklusif ke pembelajaran berkualitas bersama pembimbing terpilih.
                  </p>
                </div>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  <li className="flex items-start gap-3 rounded-xl bg-background/70 p-3.5">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald/15 text-emerald-deep">
                      <Check className="size-3.5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Kelas Online</p>
                      <p className="text-sm text-foreground/75">Sekolah Tamu Allah: Bedah Persiapan Umrohmu, Kembali dengan Mabrur — bersama Ustadz Ahmad Fauzan, Lc.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl bg-background/70 p-3.5">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald/15 text-emerald-deep">
                      <Check className="size-3.5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Kajian</p>
                      <p className="text-sm text-foreground/75">Mengenal Sirah Haramain: Bekal Sebelum ke Baitullah — bersama Ustadz Hilman Al Hazmi, Lc. (Alumni Syariah Islamiyyah Al Azhar University)</p>

                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl bg-background/70 p-3.5">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald/15 text-emerald-deep">
                      <Check className="size-3.5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">E-Sertifikat Resmi</p>
                      <p className="text-sm text-foreground/75">Diterbitkan setelah menyelesaikan kelas</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl bg-background/70 p-3.5">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald/15 text-emerald-deep">
                      <Check className="size-3.5" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Akses Rekaman</p>
                      <p className="text-sm text-foreground/75">Selamanya untuk ditonton ulang kapan saja</p>
                    </div>
                  </li>
                </ul>
              </div>

              <p className="mt-4"><strong>d.</strong> Simpan bukti pembayaran dengan baik. Sistem akan mencatat kontribusi berdasarkan <strong>Kode Pendaftaran</strong> masing-masing peserta.</p>
              <p><strong>e.</strong> Setelah pembayaran terverifikasi, peserta otomatis lanjut ke tahap <strong>Penulisan Essay</strong>. Apabila peserta tidak lolos pada tahap Berkas Administrasi, maka tidak perlu melanjutkan ke tahap Kontribusi/Donasi ini.</p>
              <p className="text-xs text-muted-foreground">Estimasi waktu: sesuai kemudahan metode pembayaran yang dipilih.</p>
            </Section>

            <Section title="3. Tahapan Essay">
              <p><strong>a.</strong> Peserta yang telah menyelesaikan tahap Kontribusi/Donasi akan mengakses halaman essay di:</p>
              <FormLink href={`https://${SITE}/essay`} label={`${SITE}/essay`} />
              <p><strong>b.</strong> Peserta wajib menyelesaikan <strong>3 essay</strong> utama sebagai bahan penilaian karakter, motivasi, dan kontribusi:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li><strong>Essay 1:</strong> Mengapa kamu layak terpilih menjadi penerima manfaat Safar Iman?</li>
                <li><strong>Essay 2:</strong> Apa mimpi, target, dan rencana setelah menunaikan umrah?</li>
                <li><strong>Essay 3:</strong> Kontribusi apa yang akan kamu berikan kepada masyarakat setelah kembali dari umrah?</li>
              </ul>
              <p><strong>c.</strong> Jawaban ditulis dengan jujur, reflektif, dan menggunakan bahasa sendiri. Plagiarisme atau penggunaan AI tanpa proses refleksi pribadi dapat mengurangi nilai.</p>
              <p><strong>d.</strong> Setelah submit, tim seleksi akan meninjau essay. Peserta yang lolos akan lanjut ke tahap <strong>TKA (Tes Kesiapan Awal)</strong>.</p>
              <p className="text-xs text-muted-foreground">Estimasi waktu: ± 30–60 menit.</p>
            </Section>

            <Section title="4. Tahapan TKA (Tes Kesiapan Awal) dengan CBT">
              <p><strong>a.</strong> Peserta yang lolos seleksi essay berhak mengikuti <strong>TKA berbasis Computer Based Test (CBT) online</strong> untuk mengukur kesiapan mental, spiritual, dan pengetahuan dasar.</p>
              <p><strong>b.</strong> Link tes CBT dan token akses dikirimkan melalui <strong>WhatsApp resmi</strong> Safar Iman sesuai dengan jadwal yang ditentukan.</p>
              <p><strong>c.</strong> Materi TKA meliputi:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Keislaman dasar & akidah.</li>
                <li>Motivasi, komitmen, dan niat ibadah.</li>
                <li>Wawasan umum tentang umrah dan manasik.</li>
                <li>Kesiapan mental & fisik selama perjalanan.</li>
              </ul>
              <p><strong>d.</strong> Soal TKA berbentuk pilihan ganda dengan batas waktu. Hasil tes tercatat otomatis di sistem dan menjadi salah satu pertimbangan seleksi akhir.</p>
              <p><strong>e.</strong> Pengumuman hasil TKA dapat dicek di <FormLink inline href={`https://${SITE}/cek-hasil`} label={`${SITE}/cek-hasil`} /> atau melalui WhatsApp resmi Safar Iman.</p>
              <p className="text-xs text-muted-foreground">Estimasi waktu: ± 60–90 menit.</p>
            </Section>

            <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-5">
              <h3 className="font-display text-base font-semibold text-emerald-deep mb-2">Catatan Penting</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-foreground/80">
                <li>Keempat tahap di atas harus dikerjakan secara berurutan dan tidak dapat dilewati.</li>
                <li>Setiap tahap akan diumumkan hasilnya melalui WhatsApp & halaman cek hasil resmi Safar Iman.</li>
                <li>Pastikan nomor WhatsApp peserta aktif agar tidak ketinggalan informasi penting.</li>
                <li>Jalur Fully Funded tetap <strong>100% GRATIS</strong>; kontribusi/kontribusi bersifat sukarela dan hanya dilakukan setelah lolos berkas administrasi.</li>
              </ul>
            </div>

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
