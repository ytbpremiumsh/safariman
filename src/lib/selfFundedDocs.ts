import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";

export type DocSettings = {
  signerName: string;
  signerPosition: string;
  signatureUrl: string;
  stampUrl: string;
  loaBody: string;
  paymentBody: string;
  attendanceBody: string;
  proposalBody: string;
  orgName: string;
  orgAddress: string;
};

export const DOC_KEYS = {
  signerName: "doc_signer_name",
  signerPosition: "doc_signer_position",
  signatureUrl: "doc_signature_url",
  stampUrl: "doc_stamp_url",
  loaBody: "doc_loa_body",
  paymentBody: "doc_payment_body",
  attendanceBody: "doc_attendance_body",
  proposalBody: "doc_proposal_body",
  orgName: "doc_org_name",
  orgAddress: "doc_org_address",
} as const;

export const DOC_DEFAULTS: DocSettings = {
  signerName: "Ketua Panitia",
  signerPosition: "Program Safar Iman",
  signatureUrl: "",
  stampUrl: "",
  orgName: "Program Safar Iman",
  orgAddress: "Sekretariat Hasanah × Prestasi Kita",
  loaBody:
    "Dengan ini Panitia Program Safar Iman secara resmi menyatakan bahwa peserta yang namanya tercantum pada surat ini telah DITERIMA dan TERDAFTAR sebagai peserta sah pada jalur Self Funded Program Safar Iman. Penerimaan ini diberikan setelah peserta melengkapi proses pendaftaran serta menyatakan kesediaan untuk mengikuti seluruh rangkaian kegiatan sesuai ketentuan yang berlaku.\n\nSebagai peserta resmi, yang bersangkutan berhak memperoleh seluruh fasilitas program meliputi tiket penerbangan pulang–pergi, akomodasi hotel di Makkah dan Madinah, konsumsi, transportasi darat, visa umrah, pembimbing ibadah (muthawif), tour leader, perlengkapan umrah, asuransi perjalanan, serta city tour ke situs-situs bersejarah di Tanah Suci.\n\nPeserta diwajibkan menaati seluruh tata tertib, mengikuti agenda manasik, technical meeting, serta seluruh sesi pembinaan yang ditetapkan oleh panitia. Penerimaan ini akan dinyatakan final setelah peserta menyelesaikan kewajiban administrasi dan pembayaran sebagaimana diatur dalam Panduan Pembayaran terlampir.\n\nKami mengucapkan selamat dan barakallahu fiik atas bergabungnya Bapak/Ibu/Saudara/i dalam Program Safar Iman. Semoga Allah SWT memudahkan langkah perjalanan menuju Baitullah dan menjadikannya umrah yang mabrur.",
  paymentBody:
    "Sebagai peserta resmi jalur Self Funded Program Safar Iman, peserta diwajibkan menyelesaikan kewajiban pembayaran biaya program sesuai dengan ketentuan yang telah ditetapkan oleh panitia. Panduan ini disusun agar proses pembayaran dapat dilakukan secara tertib, aman, dan terdokumentasi dengan baik.\n\nPembayaran dilakukan melalui transfer bank ke rekening resmi Program Safar Iman atas nama lembaga penyelenggara. Nomor rekening resmi serta nominal yang harus dibayarkan akan diinformasikan secara tertulis oleh panitia melalui kontak resmi WhatsApp. Peserta diimbau berhati-hati terhadap segala bentuk penipuan dan hanya melakukan pembayaran ke rekening resmi yang telah diverifikasi.\n\nSkema pembayaran dapat dilakukan secara penuh (full payment) maupun bertahap (cicilan) sesuai dengan kesepakatan dengan panitia. Bagi peserta yang memilih cicilan, jadwal dan besaran angsuran wajib disepakati di awal dan dilunasi paling lambat sesuai tenggat yang ditentukan sebelum keberangkatan. Keterlambatan pembayaran tanpa konfirmasi dapat berakibat pada peninjauan ulang status keikutsertaan.\n\nSetelah melakukan transfer, peserta wajib melakukan konfirmasi dengan mengirimkan bukti pembayaran yang jelas (foto/scan struk transfer) beserta nama lengkap dan kode pendaftaran kepada panitia melalui WhatsApp resmi. Panitia akan menerbitkan kuitansi resmi sebagai tanda terima yang sah dalam waktu maksimal 2x24 jam kerja.\n\nSeluruh biaya yang telah disetorkan tidak dapat dikembalikan (non-refundable), kecuali atas ketentuan force majeure yang diatur dalam kebijakan resmi panitia. Mohon menyimpan seluruh bukti pembayaran sebagai dokumen pendukung administrasi keberangkatan.",
  attendanceBody:
    "Formulir ini merupakan pernyataan resmi konfirmasi kehadiran peserta pada seluruh rangkaian kegiatan Program Safar Iman jalur Self Funded, mulai dari sesi manasik, technical meeting, hingga keberangkatan menuju Tanah Suci. Konfirmasi ini bersifat mengikat dan menjadi dasar bagi panitia dalam menyusun manifest peserta, pengurusan dokumen perjalanan, serta pemesanan tiket dan akomodasi.\n\nPeserta diwajibkan mengisi formulir ini dengan data yang sebenar-benarnya, menandatangani pada kolom yang telah disediakan, serta mengirimkan kembali kepada panitia paling lambat sesuai dengan tenggat yang telah ditetapkan. Formulir yang tidak dikembalikan dalam batas waktu yang ditentukan dianggap sebagai pengunduran diri secara sukarela dan dapat berakibat pada hangusnya hak keikutsertaan.\n\nApabila terdapat halangan kehadiran pada salah satu sesi, peserta wajib menyampaikan pemberitahuan tertulis kepada panitia disertai alasan yang dapat dipertanggungjawabkan. Ketidakhadiran tanpa keterangan pada sesi wajib (terutama manasik dan technical meeting) dapat menjadi pertimbangan panitia dalam pengambilan keputusan terkait keberangkatan.",
  proposalBody:
    "Surat ini diterbitkan secara resmi oleh Panitia Program Safar Iman sebagai pengantar atas pengajuan proposal pendanaan keberangkatan peserta jalur Self Funded. Surat pengantar ini diberikan kepada peserta sebagai bukti sah bahwa yang bersangkutan benar-benar terdaftar sebagai peserta resmi program, sehingga dapat digunakan untuk mengajukan dukungan pendanaan kepada instansi pemerintah, lembaga swasta, perusahaan, yayasan, sponsor, donatur, maupun pihak ketiga lainnya.\n\nProgram Safar Iman merupakan program pembinaan generasi muda Muslim Indonesia yang memadukan ibadah umrah, pengembangan kepemimpinan, kontribusi sosial, serta pengalaman lintas budaya di Tanah Suci. Program ini diikuti oleh peserta terpilih dari berbagai daerah di Indonesia dan dilaksanakan dengan standar penyelenggaraan profesional bekerja sama dengan biro perjalanan umrah resmi.\n\nMelalui surat ini, kami selaku panitia memohon kesediaan Bapak/Ibu pimpinan instansi/lembaga/perusahaan untuk berkenan memberikan dukungan, baik berupa donasi, sponsorship, maupun bentuk bantuan lain yang relevan, guna memperlancar keberangkatan peserta menuju Baitullah. Setiap bentuk dukungan yang diberikan akan dicatat secara transparan dan diapresiasi sebagai bagian dari kontribusi mulia untuk pengembangan generasi muda Muslim Indonesia.\n\nKami menjamin bahwa seluruh dana yang diterima akan dipergunakan sepenuhnya untuk pembiayaan operasional keberangkatan peserta, dan laporan pertanggungjawaban dapat diberikan kepada pihak donatur apabila dibutuhkan. Atas perhatian, kerja sama, dan dukungan yang diberikan, kami menyampaikan terima kasih yang sebesar-besarnya. Jazakumullahu khairan katsiran.",

};

export async function loadDocSettings(): Promise<DocSettings> {
  const { data } = await supabase
    .from("app_settings")
    .select("key,value")
    .in("key", Object.values(DOC_KEYS));
  const map = new Map((data ?? []).map((r) => [r.key as string, (r.value as string) ?? ""]));
  const out: DocSettings = { ...DOC_DEFAULTS };
  (Object.keys(DOC_KEYS) as Array<keyof typeof DOC_KEYS>).forEach((k) => {
    const v = map.get(DOC_KEYS[k]);
    if (v) (out as any)[k] = v;
  });
  return out;
}

async function fetchImage(url: string): Promise<{ data: string; w: number; h: number } | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const dataUrl: string = await new Promise((res2, rej) => {
      const r = new FileReader();
      r.onerror = () => rej(r.error);
      r.onload = () => res2(r.result as string);
      r.readAsDataURL(blob);
    });
    const dim = await new Promise<{ w: number; h: number }>((res2) => {
      const img = new Image();
      img.onload = () => res2({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => res2({ w: 200, h: 100 });
      img.src = dataUrl;
    });
    return { data: dataUrl, w: dim.w, h: dim.h };
  } catch {
    return null;
  }
}

type PeserPDF = { fullName: string; code: string; category?: string | null };

const COLORS = {
  emerald: [15, 76, 58] as const,
  gold: [193, 148, 49] as const,
  text: [33, 41, 51] as const,
  muted: [110, 120, 130] as const,
};

function header(pdf: jsPDF, title: string, settings: DocSettings) {
  pdf.setFillColor(...COLORS.emerald);
  pdf.rect(0, 0, 210, 28, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(settings.orgName, 20, 13);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(settings.orgAddress, 20, 19);
  pdf.setFillColor(...COLORS.gold);
  pdf.rect(0, 28, 210, 2, "F");

  pdf.setTextColor(...COLORS.text);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(title, 105, 44, { align: "center" });
  pdf.setDrawColor(...COLORS.gold);
  pdf.setLineWidth(0.5);
  pdf.line(80, 48, 130, 48);
}

function footer(pdf: jsPDF) {
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(
    "Dokumen ini dicetak otomatis oleh Sistem Pendaftaran Program Safar Iman.",
    105,
    287,
    { align: "center" },
  );
}

async function signatureBlock(
  pdf: jsPDF,
  startY: number,
  settings: DocSettings,
) {
  const x = 130;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.text);
  pdf.text(`Hormat kami,`, x, startY);

  const sig = await fetchImage(settings.signatureUrl);
  const stamp = await fetchImage(settings.stampUrl);

  if (stamp) {
    const w = 30;
    const h = (stamp.h / stamp.w) * w;
    pdf.addImage(stamp.data, "PNG", x - 8, startY + 4, w, h, undefined, "FAST");
  }
  if (sig) {
    const w = 35;
    const h = (sig.h / sig.w) * w;
    pdf.addImage(sig.data, "PNG", x, startY + 6, w, h, undefined, "FAST");
  }

  pdf.setFont("helvetica", "bold");
  pdf.text(settings.signerName || "—", x, startY + 35);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(settings.signerPosition || "", x, startY + 40);
}

function paragraph(pdf: jsPDF, text: string, x: number, y: number, maxW: number) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.text);
  const lines = pdf.splitTextToSize(text, maxW);
  pdf.text(lines, x, y);
  return y + lines.length * 6;
}

function todayID() {
  return new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function buildBase(
  title: string,
  body: string,
  p: PeserPDF,
  s: DocSettings,
  extraIntro?: string,
) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  header(pdf, title, s);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(`Tanggal: ${todayID()}`, 190, 60, { align: "right" });
  pdf.text(`Kode: ${p.code}`, 190, 65, { align: "right" });

  pdf.setTextColor(...COLORS.text);
  let y = 75;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Kepada Yth.", 20, y);
  y += 6;
  pdf.setFontSize(12);
  pdf.text(p.fullName, 20, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(`Peserta Self Funded — Program Safar Iman`, 20, y);
  y += 12;

  if (extraIntro) {
    y = paragraph(pdf, extraIntro, 20, y, 170) + 4;
  }
  y = paragraph(pdf, body, 20, y, 170) + 18;

  await signatureBlock(pdf, Math.max(y, 200), s);
  footer(pdf);
  return pdf;
}

async function buildLOA(p: PeserPDF, s: DocSettings) {
  const intro = `Assalamu'alaikum warahmatullahi wabarakatuh,\n\nDengan memanjatkan rasa syukur kehadirat Allah SWT, bersama surat ini kami sampaikan:`;
  return buildBase("LETTER OF ACCEPTANCE", s.loaBody, p, s, intro);
}
async function buildPaymentGuide(p: PeserPDF, s: DocSettings) {
  return buildBase("PANDUAN PEMBAYARAN", s.paymentBody, p, s);
}
async function buildAttendance(p: PeserPDF, s: DocSettings) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  header(pdf, "FORM KONFIRMASI KEHADIRAN", s);
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(`Tanggal: ${todayID()}`, 190, 60, { align: "right" });
  pdf.text(`Kode: ${p.code}`, 190, 65, { align: "right" });

  pdf.setTextColor(...COLORS.text);
  let y = paragraph(pdf, s.attendanceBody, 20, 78, 170) + 8;

  const rows: Array<[string, string]> = [
    ["Nama Lengkap", p.fullName],
    ["Kode Pendaftaran", p.code],
    ["Kategori", "Self Funded"],
    ["No. WhatsApp", "............................................"],
    ["Konfirmasi Kehadiran", "[  ] HADIR        [  ] TIDAK HADIR"],
    ["Catatan", "............................................"],
  ];
  pdf.setFontSize(10);
  rows.forEach(([k, v]) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(`${k}`, 20, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(`: ${v}`, 65, y);
    y += 8;
  });

  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Tanda Tangan Peserta,", 20, y);
  pdf.text(`(${p.fullName})`, 20, y + 28);
  pdf.line(20, y + 25, 80, y + 25);

  await signatureBlock(pdf, y, s);
  footer(pdf);
  return pdf;
}
async function buildProposal(p: PeserPDF, s: DocSettings) {
  const intro = `Kepada Yth.\nBapak/Ibu Pimpinan / Donatur / Sponsor\nDi Tempat\n\nAssalamu'alaikum warahmatullahi wabarakatuh,`;
  return buildBase("SURAT PENGANTAR PROPOSAL", s.proposalBody, p, s, intro);
}

export type DocKind = "loa" | "payment" | "attendance" | "proposal";

export const DOC_META: Record<DocKind, { label: string; filePrefix: string }> = {
  loa: { label: "Letter of Acceptance", filePrefix: "LOA" },
  payment: { label: "Panduan Pembayaran", filePrefix: "Panduan-Pembayaran" },
  attendance: { label: "Form Konfirmasi Kehadiran", filePrefix: "Konfirmasi-Kehadiran" },
  proposal: { label: "Surat Pengantar Proposal", filePrefix: "Surat-Pengantar-Proposal" },
};

export async function buildDoc(kind: DocKind, p: PeserPDF, s: DocSettings) {
  switch (kind) {
    case "loa": return buildLOA(p, s);
    case "payment": return buildPaymentGuide(p, s);
    case "attendance": return buildAttendance(p, s);
    case "proposal": return buildProposal(p, s);
  }
}

export async function downloadDoc(kind: DocKind, p: PeserPDF, s: DocSettings) {
  const pdf = await buildDoc(kind, p, s);
  pdf.save(`${DOC_META[kind].filePrefix}-${p.code}.pdf`);
}

export async function getDocBlobUrl(kind: DocKind, p: PeserPDF, s: DocSettings) {
  const pdf = await buildDoc(kind, p, s);
  return pdf.output("bloburl") as unknown as string;
}

export const downloadLOA = (p: PeserPDF, s: DocSettings) => downloadDoc("loa", p, s);
export const downloadPaymentGuide = (p: PeserPDF, s: DocSettings) => downloadDoc("payment", p, s);
export const downloadAttendance = (p: PeserPDF, s: DocSettings) => downloadDoc("attendance", p, s);
export const downloadProposalLetter = (p: PeserPDF, s: DocSettings) => downloadDoc("proposal", p, s);
