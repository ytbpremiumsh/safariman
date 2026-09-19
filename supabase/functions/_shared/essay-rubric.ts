export type EssayCriterion = { label: string; point: number };
export type EssayRubricQuestion = { key: string; title: string; criteria: EssayCriterion[] };

export const ESSAY_RUBRIC: EssayRubricQuestion[] = [
  { key: "essay_1", title: "Essay 1 — Kenapa layak dipilih?", criteria: [
    { label: "Niat ibadah yang kuat", point: 4 }, { label: "Komitmen mengikuti program", point: 2 },
    { label: "Bersyukur atas kesempatan", point: 2 }, { label: "Menjadi inspirasi orang lain", point: 1 },
    { label: "Kerendahan hati", point: 1 },
  ] },
  { key: "essay_2", title: "Essay 2 — Impian setelah ke Tanah Suci", criteria: [
    { label: "Menjadi pribadi lebih baik", point: 2 }, { label: "Menjaga ibadah setelah pulang", point: 2 },
    { label: "Berbagi pengalaman", point: 2 }, { label: "Berdakwah / mengajak kebaikan", point: 2 },
    { label: "Kontribusi sosial", point: 2 },
  ] },
  { key: "essay_3", title: "Essay 3 — Kontribusi untuk umat", criteria: [
    { label: "Dakwah", point: 2 }, { label: "Pendidikan", point: 2 }, { label: "Sosial / kemanusiaan", point: 2 },
    { label: "Membantu masyarakat sekitar", point: 2 }, { label: "Program nyata yang pernah dilakukan", point: 2 },
  ] },
  { key: "case_1", title: "Studi Kasus 1 — Kehilangan rombongan tanpa ponsel", criteria: [
    { label: "Tetap tenang", point: 4 }, { label: "Tidak panik", point: 2 }, { label: "Menuju titik kumpul", point: 2 },
    { label: "Menghubungi petugas", point: 1 }, { label: "Menunggu instruksi", point: 1 },
  ] },
  { key: "case_2", title: "Studi Kasus 2 — Jamaah lansia kelelahan", criteria: [
    { label: "Empati & kepedulian", point: 2 }, { label: "Membantu secara fisik", point: 2 }, { label: "Memberi minum", point: 2 },
    { label: "Mengajak istirahat", point: 2 }, { label: "Menghubungi pembimbing / ketua rombongan", point: 2 },
  ] },
  { key: "case_3", title: "Studi Kasus 3 — Jamaah kelelahan berat / kondisi darurat", criteria: [
    { label: "Prioritaskan kesehatan", point: 2 }, { label: "Mencari tempat duduk / teduh", point: 2 },
    { label: "Meminta bantuan petugas", point: 2 }, { label: "Mendampingi jamaah", point: 2 },
    { label: "Informasikan ke ketua rombongan", point: 2 },
  ] },
  { key: "case_4", title: "Studi Kasus 4 — Perbedaan pendapat jadwal ziarah", criteria: [
    { label: "Musyawarah", point: 2 }, { label: "Menghargai pendapat orang lain", point: 2 }, { label: "Menjaga ukhuwah", point: 2 },
    { label: "Mengajak berdiskusi", point: 2 }, { label: "Mengikuti keputusan bersama", point: 2 },
  ] },
  { key: "case_5", title: "Studi Kasus 5 — Menemukan dompet jamaah lain", criteria: [
    { label: "Tidak mengambil untuk kepentingan pribadi", point: 2 }, { label: "Menyerahkan ke petugas resmi", point: 4 },
    { label: "Melaporkan kehilangan", point: 2 }, { label: "Menjaga amanah", point: 1 },
    { label: "Mencari pemilik dompet dari identitas", point: 1 },
  ] },
  { key: "case_6", title: "Studi Kasus 6 — Terpisah saat tawaf, kondisi padat", criteria: [
    { label: "Tetap tenang", point: 2 }, { label: "Fokus pada ibadah", point: 2 }, { label: "Tidak melawan arus", point: 2 },
    { label: "Menuju titik temu", point: 3 }, { label: "Menghubungi pendamping setelah aman", point: 1 },
  ] },
  { key: "case_7", title: "Studi Kasus 7 — Cuaca ekstrem & dehidrasi", criteria: [
    { label: "Edukasi tentang bahaya dehidrasi", point: 2 }, { label: "Menjelaskan dengan bijak", point: 2 },
    { label: "Mengajak minum secukupnya", point: 2 }, { label: "Utamakan keselamatan", point: 2 },
    { label: "Memberikan contoh yang baik", point: 2 },
  ] },
];