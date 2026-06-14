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
    "Dengan ini panitia Program Safar Iman menyatakan bahwa peserta yang namanya tercantum di bawah ini secara resmi DITERIMA sebagai peserta jalur Self Funded. Selamat dan barakallahu fiik. Mohon perhatikan jadwal & panduan pembayaran yang dilampirkan dalam dokumen ini.",
  paymentBody:
    "Pembayaran Self Funded dapat dilakukan melalui transfer bank ke rekening resmi Program Safar Iman. Setelah transfer, mohon konfirmasi dengan mengirimkan bukti pembayaran ke nomor WhatsApp panitia. Cicilan dapat dilakukan dengan tenggat waktu yang telah disepakati panitia.",
  attendanceBody:
    "Mohon mengisi form ini sebagai konfirmasi kesediaan menghadiri seluruh rangkaian acara Program Safar Iman jalur Self Funded. Konfirmasi kehadiran wajib ditandatangani dan dikirimkan kembali ke panitia sebelum batas waktu yang ditentukan.",
  proposalBody:
    "Surat ini diberikan kepada peserta sebagai pengantar resmi untuk pengajuan proposal kepada pihak sponsor, instansi, atau donatur dalam rangka pendanaan keberangkatan pada Program Safar Iman. Kami mohon dukungan dan bantuan Bapak/Ibu untuk memuluskan keberangkatan peserta.",
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

export async function downloadLOA(p: PeserPDF, s: DocSettings) {
  const intro = `Assalamu'alaikum warahmatullahi wabarakatuh,\n\nDengan memanjatkan rasa syukur kehadirat Allah SWT, bersama surat ini kami sampaikan:`;
  const pdf = await buildBase("LETTER OF ACCEPTANCE", s.loaBody, p, s, intro);
  pdf.save(`LOA-${p.code}.pdf`);
}

export async function downloadPaymentGuide(p: PeserPDF, s: DocSettings) {
  const pdf = await buildBase("PANDUAN PEMBAYARAN", s.paymentBody, p, s);
  pdf.save(`Panduan-Pembayaran-${p.code}.pdf`);
}

export async function downloadAttendance(p: PeserPDF, s: DocSettings) {
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
  pdf.save(`Konfirmasi-Kehadiran-${p.code}.pdf`);
}

export async function downloadProposalLetter(p: PeserPDF, s: DocSettings) {
  const intro = `Kepada Yth.\nBapak/Ibu Pimpinan / Donatur / Sponsor\nDi Tempat\n\nAssalamu'alaikum warahmatullahi wabarakatuh,`;
  const pdf = await buildBase("SURAT PENGANTAR PROPOSAL", s.proposalBody, p, s, intro);
  pdf.save(`Surat-Pengantar-Proposal-${p.code}.pdf`);
}
