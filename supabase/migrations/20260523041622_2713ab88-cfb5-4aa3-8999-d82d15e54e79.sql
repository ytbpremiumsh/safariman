
-- 1) Update generator kode pendaftaran ke format HXP-XXXXXXXX
CREATE OR REPLACE FUNCTION public.gen_registration_code()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'HXP-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
$$;

-- 2) Update template WA jadi profesional & islami
INSERT INTO public.app_settings (key, value, updated_at) VALUES
('wa_template_pendaftaran',
E'Assalamu''alaikum warahmatullahi wabarakatuh\n\nBismillahirrahmanirrahim.\n\nAhlan wa sahlan, Saudara/i *{nama}* 🌙\n\nAlhamdulillah, pendaftaran Anda untuk program *SAFAR IMAN* — Program Umrah Penuh Berkah — telah berhasil kami terima.\n\n📌 *Kode Pendaftaran Anda:*\n*{kode}*\n\nMohon simpan kode di atas dengan baik. Kode ini diperlukan untuk:\n• Mengirim berkas & essay\n• Konfirmasi tahapan seleksi berikutnya\n\n🕋 *Langkah Selanjutnya:*\n1. Bagikan twibbon untuk syiar program\n2. Lengkapi berkas & essay melalui website\n3. Tunggu pengumuman hasil seleksi\n\nSemoga Allah Subhanahu wa Ta''ala memudahkan langkah Anda menuju Baitullah dan menerima setiap niat baik kita. Aamiin Ya Rabbal ''Alamin.\n\nJazakumullahu khairan katsiran 🤲\n\n_Panitia Safar Iman_',
now()),
('wa_template_berkas',
E'Assalamu''alaikum warahmatullahi wabarakatuh\n\nBarakallahu fiik, *{nama}* ✨\n\nAlhamdulillah, berkas dan essay Anda untuk program *SAFAR IMAN* dengan kode pendaftaran *{kode}* telah berhasil kami terima.\n\n📋 *Status:* Berkas Lengkap — sedang dalam proses verifikasi tim seleksi.\n\nMohon doakan agar proses seleksi berjalan lancar dan diberikan keputusan yang terbaik oleh Allah Subhanahu wa Ta''ala.\n\nKami akan menghubungi Anda kembali melalui WhatsApp ini untuk pengumuman hasil seleksi.\n\n_"Dan barangsiapa yang bertaqwa kepada Allah, niscaya Dia akan memberikan jalan keluar baginya."_ (QS. At-Talaq: 2)\n\nJazakumullahu khairan 🤲\n\n_Panitia Safar Iman_',
now()),
('wa_template_lolos',
E'Assalamu''alaikum warahmatullahi wabarakatuh\n\n🎉 *MABRUK! Selamat, {nama}* 🎉\n\nDengan memohon ridha Allah Subhanahu wa Ta''ala, kami sampaikan kabar gembira:\n\nAnda dinyatakan *LOLOS SELEKSI* program *SAFAR IMAN*\n📌 Kategori: *{kategori}*\n📌 Kode Pendaftaran: *{kode}*\n\nLabbaik Allahumma labbaik 🕋\n\nPanitia akan menghubungi Anda dalam waktu dekat untuk:\n• Briefing teknis keberangkatan\n• Kelengkapan dokumen perjalanan\n• Jadwal manasik umrah\n\nSemoga Allah meneguhkan langkah, melapangkan dada, dan menerima ibadah umrah Anda. Aamiin Ya Mujibassailin.\n\nBarakallahu fiik wa jazakumullahu khairan 🤲\n\n_Panitia Safar Iman_',
now()),
('wa_template_ditolak',
E'Assalamu''alaikum warahmatullahi wabarakatuh\n\nKepada Saudara/i *{nama}* yang dirahmati Allah,\n\nTerima kasih atas niat tulus dan partisipasi Anda dalam program *SAFAR IMAN*.\n\nSetelah melalui proses seleksi yang panjang dan penuh pertimbangan, dengan berat hati kami sampaikan bahwa pada kesempatan ini Anda *belum berkesempatan* lolos seleksi.\n\nNamun, yakinlah bahwa setiap kebaikan yang sudah dicatat tidak akan sia-sia di sisi Allah Subhanahu wa Ta''ala.\n\n_"Boleh jadi kamu membenci sesuatu, padahal ia amat baik bagimu."_ (QS. Al-Baqarah: 216)\n\nTetaplah istiqamah berdoa, sebab undangan ke Baitullah adalah hak prerogatif Allah. Pintu kebaikan masih sangat luas, insya Allah.\n\nBarakallahu fiik 🤲\n\n_Panitia Safar Iman_',
now()),
('wa_template_custom',
E'Assalamu''alaikum warahmatullahi wabarakatuh\n\n{nama},\n\n[tulis pesan kustom di sini]\n\nBarakallahu fiik 🤲\n_Panitia Safar Iman_',
now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
