import { authenticatedUser, corsHeaders, json } from "../_shared/staff-auth.ts";
import { ESSAY_RUBRIC } from "../_shared/essay-rubric.ts";

type Participant = {
  id: string;
  [key: string]: unknown;
};
type StaffClients = Awaited<ReturnType<typeof authenticatedUser>>;

const scoreKeys = ["essay_1", "essay_2", "essay_3", "case_1", "case_2", "case_3", "case_4", "case_5", "case_6", "case_7"];
function parseCriteriaChecks(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const checks: Record<string, number[]> = {};
  for (const question of ESSAY_RUBRIC) {
    const selected = input[question.key];
    if (!Array.isArray(selected) || selected.some((index) => !Number.isInteger(index) || Number(index) < 0 || Number(index) >= question.criteria.length)) return null;
    checks[question.key] = [...new Set(selected.map(Number))];
  }
  return checks;
}

function parseScores(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).length !== scoreKeys.length) return null;
  const scores: Record<string, number> = {};
  for (const key of scoreKeys) {
    const score = input[key];
    if (!Number.isInteger(score) || Number(score) < 0 || Number(score) > 10) return null;
    scores[key] = Number(score);
  }
  return { scores, total: Object.values(scores).reduce((sum, score) => sum + score, 0) };
}

type Confidence = "high" | "medium" | "low";
type AiCriterion = { index: number; matched: boolean; confidence: Confidence; evidence: string };
type AiAuthorship = { verdict: "likely_human" | "likely_ai" | "uncertain"; confidence: Confidence; reason: string };

const RUBRIC_SEMANTIC_GUIDANCE: Record<string, string[]> = {
  essay_1: [
    "Ada orientasi ibadah kepada Allah/Tanah Suci yang jelas dan menjadi alasan utama; doa, membantu jamaah, atau kalimat positif saja tidak otomatis membuktikannya.",
    "Ada kesediaan nyata mengikuti seluruh rangkaian, aturan, pembinaan, atau tanggung jawab program; rencana beribadah saat umrah saja bukan komitmen mengikuti program.",
    "Ada ungkapan syukur atau memandang kesempatan sebagai nikmat/amanah; sekadar senang, berharap terpilih, atau merasa layak tidak cukup.",
    "Ada niat atau dampak eksplisit untuk memberi teladan, memotivasi, atau menginspirasi orang lain; membantu orang saja tidak otomatis berarti menginspirasi.",
    "Ada sikap tidak menyombongkan diri, mengakui keterbatasan, tidak merasa paling layak, atau menyerahkan hasil kepada Allah; menolong, berkorban, dan bersikap baik saja bukan bukti kerendahan hati.",
  ],
  essay_2: [
    "Ada perubahan diri/akhlak/kebiasaan yang ingin diwujudkan setelah pulang, bukan hanya perasaan bahagia atau harapan umum.",
    "Ada niat menjaga atau meningkatkan ibadah secara berkelanjutan setelah pulang; ibadah yang hanya dilakukan selama perjalanan tidak cukup.",
    "Ada rencana menceritakan, membagikan pengalaman, atau menyampaikan pelajaran perjalanan kepada orang lain.",
    "Ada tindakan mengajak orang kepada kebaikan/ibadah atau berdakwah; berbagi cerita tanpa ajakan kebaikan tidak otomatis termasuk dakwah.",
    "Ada rencana kegiatan sosial dengan penerima manfaat yang jelas; menjadi lebih baik bagi diri sendiri atau sekadar ingin bermanfaat tidak cukup.",
  ],
  essay_3: [
    "Ada aktivitas menyampaikan ajaran Islam atau mengajak ibadah/kebaikan secara nyata; kata dakwah tanpa bentuk tindakan yang jelas tidak cukup.",
    "Ada tindakan mengajar, membimbing belajar, menyediakan akses belajar, atau program pendidikan untuk orang lain; pendidikan diri sendiri, profesi, atau penyebutan kata pendidikan tidak cukup.",
    "Ada bantuan sosial/kemanusiaan konkret kepada penerima manfaat, misalnya bantuan kebutuhan, kesehatan, kebencanaan, atau kelompok rentan.",
    "Ada tindakan yang secara spesifik ditujukan kepada warga/komunitas di lingkungan sekitar; kontribusi umum tanpa sasaran masyarakat sekitar tidak cukup.",
    "Ada program atau kegiatan yang benar-benar pernah dilakukan, ditandai pengalaman masa lalu yang konkret; rencana masa depan dan niat saja tidak cukup.",
  ],
  case_1: [
    "Peserta menyatakan akan menenangkan diri dan berpikir jernih dalam situasi tersebut.",
    "Peserta menyatakan tidak panik/tidak bertindak gegabah; menyebut kemungkinan panik atau nasihat umum bukan bukti.",
    "Peserta akan menuju lokasi pertemuan yang telah disepakati/titik kumpul, bukan sekadar mencari rombongan tanpa tujuan jelas.",
    "Peserta sendiri akan mencari atau menghubungi petugas/pembimbing/pihak resmi untuk bantuan.",
    "Peserta akan menunggu arahan atau tetap di lokasi aman setelah melapor; hanya meminta bantuan belum membuktikan menunggu instruksi.",
  ],
  case_2: [
    "Ada perhatian pada kondisi lansia dan respons peduli, bukan hanya pengamatan bahwa lansia lelah.",
    "Ada bantuan fisik langsung seperti menopang, memapah, membawakan barang, atau membantu berjalan.",
    "Ada tindakan menawarkan/memberikan air minum, bukan hanya menyebut dehidrasi atau air.",
    "Ada tindakan mengajak berhenti dan beristirahat di tempat yang sesuai.",
    "Ada tindakan menghubungi pembimbing/ketua rombongan/petugas yang bertanggung jawab.",
  ],
  case_3: [
    "Keputusan menempatkan kondisi kesehatan/keselamatan di atas kelanjutan aktivitas atau ibadah.",
    "Ada tindakan membawa/mencari tempat duduk, teduh, atau tempat aman untuk pemulihan.",
    "Ada tindakan meminta bantuan petugas/tenaga medis/pihak resmi.",
    "Ada tindakan tetap bersama dan tidak meninggalkan jamaah yang sakit.",
    "Ada tindakan memberi tahu ketua rombongan/pembimbing tentang kondisi jamaah.",
  ],
  case_4: [
    "Ada upaya mencapai keputusan melalui musyawarah bersama, bukan memaksakan pilihan pribadi.",
    "Ada penerimaan/mendengarkan pandangan berbeda tanpa merendahkan atau memaksakan pendapat.",
    "Ada tujuan atau tindakan menjaga persaudaraan/kerukunan dan mencegah konflik.",
    "Ada ajakan nyata untuk duduk bersama, berbicara, atau membahas pilihan.",
    "Ada kesediaan menerima keputusan/kesepakatan kelompok meskipun berbeda dari pilihan pribadi.",
  ],
  case_5: [
    "Ada keputusan eksplisit tidak memakai, menyimpan untuk diri sendiri, atau mengambil isi dompet.",
    "Ada tindakan menyerahkan dompet kepada petugas resmi/pihak berwenang, bukan hanya menyimpannya atau mengumumkannya sendiri.",
    "Ada tindakan melaporkan temuan dompet kepada petugas/rombongan/pihak resmi.",
    "Ada sikap menjaga barang tetap utuh/aman sampai dikembalikan; kata amanah tanpa perilaku pendukung tidak cukup.",
    "Ada tindakan memeriksa identitas secara wajar untuk menemukan pemilik, bukan mengambil data untuk kepentingan lain.",
  ],
  case_6: [
    "Peserta menyatakan akan menenangkan diri dan berpikir jernih ketika terpisah.",
    "Ada upaya tetap melanjutkan/menjaga kekhusyukan ibadah dengan aman; sekadar menyebut tawaf tidak cukup.",
    "Ada keputusan tidak menerobos atau bergerak berlawanan dengan arus jamaah.",
    "Ada tindakan menuju titik temu yang telah disepakati setelah memungkinkan/aman.",
    "Ada urutan jelas menghubungi pendamping setelah berada pada posisi aman, bukan mengoperasikan ponsel di tengah kondisi berbahaya.",
  ],
  case_7: [
    "Ada tindakan memberi pemahaman tentang risiko/akibat kekurangan cairan, bukan hanya menyebut cuaca panas.",
    "Ada cara penyampaian yang lembut, masuk akal, tidak memaksa, atau disesuaikan dengan kondisi orang tersebut.",
    "Ada ajakan nyata untuk minum dengan jumlah/cara yang wajar.",
    "Keputusan jelas memprioritaskan keselamatan/kesehatan dibanding memaksakan aktivitas.",
    "Peserta memberi teladan melalui tindakannya sendiri, misalnya ikut minum/beristirahat; sekadar memberi nasihat bukan contoh nyata.",
  ],
};

function cleanJson(text: string) {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (trimmed.startsWith("```")) return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return trimmed;
}

function messageContent(value: unknown) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((part) => {
    if (typeof part === "string") return part;
    if (!part || typeof part !== "object") return "";
    const record = part as Record<string, unknown>;
    return typeof record.text === "string" ? record.text : typeof record.content === "string" ? record.content : "";
  }).join("");
}

function parseJsonObject(text: string) {
  const candidate = cleanJson(text);
  try { return JSON.parse(candidate) as Record<string, unknown>; } catch { /* try extracting a complete object */ }
  const start = candidate.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < candidate.length; index += 1) {
    const char = candidate[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try { return JSON.parse(candidate.slice(start, index + 1)) as Record<string, unknown>; } catch { return null; }
      }
    }
  }
  return null;
}

function normalizeEvidence(value: string) {
  return value.toLocaleLowerCase("id-ID").replace(/\s+/g, " ").trim();
}

const OPENROUTER_RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function providerErrorMessage(status: number, providerMessage: string) {
  if (status === 401 || status === 403) return "API key OpenRouter ditolak. Hubungi admin untuk memeriksa konfigurasi AI.";
  if (status === 402) return "Saldo atau batas penggunaan OpenRouter tidak mencukupi. Hubungi admin.";
  if (status === 404) return "Model OpenRouter yang dipilih tidak tersedia. Hubungi admin untuk mengganti model.";
  if (status === 429) return "Model AI sedang penuh atau terkena batas permintaan. Sistem sudah mencoba ulang; silakan coba lagi sebentar.";
  if (status >= 500) return "Provider model AI sedang mengalami gangguan sementara. Sistem sudah mencoba ulang; silakan coba lagi sebentar.";
  if (/provider returned error/i.test(providerMessage)) return "Provider model AI sedang bermasalah. Sistem sudah mencoba ulang; silakan coba lagi sebentar.";
  return providerMessage || `OpenRouter gagal memproses analisis (${status}).`;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function analyzeWithOpenRouter(admin: StaffClients["admin"], participantId: string) {
  const { data: secret, error: secretError } = await admin.from("ai_provider_secrets")
    .select("api_key").eq("provider", "openrouter").maybeSingle();
  const apiKey = String(secret?.api_key ?? "").trim();
  if (secretError || !apiKey) return { response: json({ error: "OpenRouter belum terhubung. Admin perlu menyimpan API key terlebih dahulu." }, 503) };

  const answerColumns = ["essay_worthy", "essay_dream", "essay_contribution", "case_study_1", "case_study_2", "case_study_3", "case_study_4", "case_study_5", "case_study_6", "case_study_7"];
  const { data: participant, error } = await admin.from("participants").select(`id,${answerColumns.join(",")}`).eq("id", participantId).maybeSingle();
  if (error || !participant) return { response: json({ error: "Peserta tidak ditemukan" }, 404) };

  const { data: modelSetting } = await admin.from("app_settings").select("value").eq("key", "ai_openrouter_model").maybeSingle();
  const model = String(modelSetting?.value ?? "openai/gpt-4o-mini").trim() || "openai/gpt-4o-mini";
  const answers = Object.fromEntries(ESSAY_RUBRIC.map((question, index) => [question.key, String(participant[answerColumns[index]] ?? "")]));
  const system = `Anda adalah asisten penilaian Essay dan Studi Kasus Safar Iman. Tugas Anda menilai KESESUAIAN MAKNA jawaban dengan rubrik, bukan mencari kemunculan kata kunci.

ALUR WAJIB DUA TAHAP — JANGAN DIBALIK:
TAHAP 1 — PEMAHAMAN JAWABAN:
- Baca SELURUH jawaban terlebih dahulu sebelum melihat kecocokan poin.
- Simpulkan apa yang benar-benar dimaksud peserta: siapa pelakunya, tindakan/niatnya, objek atau penerima manfaatnya, waktu pelaksanaannya, alasan, dan hasil yang dituju.
- Bedakan pengalaman masa lalu, kondisi sekarang, rencana masa depan, contoh hipotetis, dan ucapan tentang orang lain.

TAHAP 2 — PENGUJIAN RUBRIK:
- Setelah makna utuh dipahami, bandingkan makna tersebut dengan definisi_semantik setiap poin.
- Kata kunci hanya boleh menjadi petunjuk lokasi kalimat, BUKAN dasar pemberian poin.
- Gunakan UJI PENGHAPUSAN KATA: bayangkan kata yang sama dengan label kriteria dihapus. Jika maksud narasinya tidak lagi jelas memenuhi kriteria, matched harus false.
- Gunakan UJI SUBJEK-TINDAKAN-TUJUAN: pastikan siapa yang bertindak, apa tindakannya, dan untuk tujuan/siapa tindakan itu. Kesesuaian topik tanpa hubungan ini harus false.
- Definisi semantik adalah batas penilaian. Jangan memperluas satu kriteria menjadi perilaku positif lain yang terdengar mirip.

ATURAN WAJIB PENILAIAN:
1. Baca satu jawaban secara utuh dan pahami tujuan, niat, tindakan, alasan, serta dampak yang benar-benar dinyatakan peserta.
2. Evaluasi setiap kriteria secara terpisah. matched=true hanya jika ada pernyataan yang secara jelas membuktikan makna kriteria tersebut.
3. Kemunculan nama kriteria, satu kata, sinonim, atau topik yang sama TIDAK CUKUP untuk matched=true.
4. Jangan menebak maksud yang tidak tertulis. Jangan memperluas arti jawaban berdasarkan asumsi yang masuk akal tetapi tidak dinyatakan peserta.
5. Perhatikan negasi, penolakan, perbandingan, contoh hipotetis, kutipan pendapat orang lain, dan konteks kalimat. Kata yang muncul dalam konteks tersebut tidak otomatis menjadi sikap atau tindakan peserta.
6. Untuk kriteria tindakan atau kontribusi, harus ada tindakan, rencana konkret, kebiasaan, sasaran penerima manfaat, atau pengalaman nyata yang relevan. Keinginan umum seperti "ingin bermanfaat" tidak cukup untuk membuktikan bidang kontribusi tertentu.
7. evidence wajib berupa kutipan persis dan singkat dari jawaban yang membuktikan hubungan makna. Jika tidak ada kutipan yang benar-benar membuktikan kriteria, gunakan matched=false dan evidence="".
8. Gunakan confidence=high hanya jika bukti eksplisit, hubungan maknanya langsung, dan lulus uji subjek-tindakan-tujuan. Jika bukti tersirat, hanya memiliki kata/topik serupa, atau masih dapat ditafsirkan lain, gunakan matched=false; confidence boleh medium atau low.
9. Jangan memberi poin karena gaya bahasa bagus, jawaban panjang, atau tema yang terdengar positif. Jangan memberi keputusan kelulusan.
10. Satu kutipan boleh mendukung lebih dari satu poin HANYA jika narasinya memang membuktikan arti masing-masing poin secara mandiri. Jangan menggandakan poin hanya karena tindakannya positif.
11. Untuk setiap matched=true, semantic_reason harus menjelaskan hubungan antara makna kutipan dan definisi poin secara sangat singkat. Alasan yang hanya mengulang label kriteria tidak valid.
12. Demi respons cepat, JANGAN kirim kriteria dengan matched=false. Hanya masukkan kriteria yang benar-benar matched=true; kriteria yang tidak dikirim otomatis dianggap false.

CONTOH PENTING:
- Jawaban "Saya ingin melanjutkan pendidikan" TIDAK membuktikan kriteria kontribusi Pendidikan karena hanya membahas pendidikan peserta sendiri.
- Jawaban "Saya bekerja di bidang pendidikan, tetapi kontribusi yang ingin saya lakukan adalah membagikan sembako" TIDAK membuktikan kontribusi Pendidikan; konteks tindakannya adalah sosial.
- Jawaban "Saya akan mengajar mengaji anak-anak di desa setiap pekan" DAPAT membuktikan kontribusi Pendidikan karena ada tindakan, sasaran, dan konteks pembelajaran.
- Jawaban yang menyebut "tidak panik" dalam kalimat "Saya pasti tidak bisa menahan panik" TIDAK membuktikan kriteria Tidak panik karena maknanya berlawanan.
- Jawaban "Saya menyarankan orang lain menghubungi petugas" tidak selalu membuktikan bahwa peserta sendiri akan menghubungi petugas; nilai sesuai pelaku tindakan yang tertulis.

PROSEDUR INTERNAL UNTUK SETIAP KRITERIA:
A. Rumuskan dalam pikiran arti inti kriteria.
B. Cari klaim atau tindakan peserta yang relevan dalam keseluruhan narasi.
C. Uji apakah kutipan tersebut tetap membuktikan kriteria tanpa mengandalkan kemunculan kata kunci.
D. Cocokkan dengan definisi_semantik khusus poin tersebut, bukan hanya label singkatnya.
E. Jika tidak, bertentangan, terlalu umum, hanya satu topik, atau pelakunya bukan peserta, tetapkan matched=false.

Untuk setiap jawaban, perkirakan pola kepenulisan dalam authorship.verdict: likely_human, likely_ai, atau uncertain. Analisis variasi gaya, kekhususan pengalaman pribadi, pola kalimat, repetisi, dan bahasa yang terlalu generik. Hasil ini hanya indikasi, bukan bukti mutlak. confidence wajib high, medium, atau low dan reason berupa alasan singkat tanpa menghakimi.

Lakukan pemahaman/ringkasan jawaban secara internal, tetapi JANGAN keluarkan answer_summary agar respons ringkas.
Balas dengan satu objek JSON valid saja, tanpa markdown dan tanpa teks tambahan, dengan struktur: {"questions":[{"key":"essay_1","criteria":[{"index":0,"matched":true,"confidence":"high","evidence":"kutipan persis","semantic_reason":"alasan sangat singkat"}],"authorship":{"verdict":"uncertain","confidence":"low","reason":"alasan singkat"}}]}. Sertakan seluruh soal dan authorship, tetapi dalam criteria HANYA sertakan poin matched=true. Jika tidak ada poin yang cocok, gunakan criteria:[].`;
  const rubricWithGuidance = ESSAY_RUBRIC.map((question) => ({
    ...question,
    criteria: question.criteria.map((criterion, index) => ({
      ...criterion,
      definisi_semantik: RUBRIC_SEMANTIC_GUIDANCE[question.key]?.[index] ?? criterion.label,
    })),
  }));
  const baseMessages = [{ role: "system", content: system }, { role: "user", content: JSON.stringify({ rubric: rubricWithGuidance, answers }) }];
  // Sisakan ruang dari batas request Supabase agar fungsi selalu sempat mengirim respons yang jelas.
  const analysisDeadline = Date.now() + 75_000;
  const requestOpenRouter = async (messages: Array<{ role: string; content: string }>, maxAttempts = 2) => {
    let lastStatus = 502;
    let lastProviderMessage = "";

    for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber += 1) {
      const remainingMilliseconds = analysisDeadline - Date.now();
      if (remainingMilliseconds < 5_000) break;
      const timeoutMilliseconds = Math.min(32_000, remainingMilliseconds - 1_000);

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://safariman.id",
            "X-Title": "Safar Iman Staff Review",
          },
          signal: AbortSignal.timeout(timeoutMilliseconds),
          body: JSON.stringify({
            model,
            messages,
            response_format: { type: "json_object" },
            provider: { allow_fallbacks: true },
            temperature: 0,
            max_tokens: 6000,
          }),
        });
        const raw = await response.text();
        if (!response.ok) {
          lastStatus = response.status;
          try { lastProviderMessage = JSON.parse(raw)?.error?.message ?? ""; } catch { lastProviderMessage = ""; }
          const mayRetry = OPENROUTER_RETRYABLE_STATUS.has(response.status)
            || /provider returned error/i.test(lastProviderMessage);
          if (mayRetry && attemptNumber < maxAttempts && analysisDeadline - Date.now() > 6_000) {
            const retryAfterSeconds = Number(response.headers.get("retry-after"));
            const retryDelay = Number.isFinite(retryAfterSeconds)
              ? Math.min(2_000, Math.max(500, retryAfterSeconds * 1_000))
              : 750 * attemptNumber;
            await delay(retryDelay);
            continue;
          }
          return {
            error: json({
              error: providerErrorMessage(response.status, lastProviderMessage),
              provider_status: response.status,
              retryable: mayRetry,
            }, mayRetry ? 503 : response.status),
          };
        }
        try {
          const envelope = JSON.parse(raw);
          const content = messageContent(envelope?.choices?.[0]?.message?.content);
          const parsed = parseJsonObject(content);
          const questions = parsed?.questions;
          return { content, parsed: parsed && Array.isArray(questions) ? parsed : null };
        } catch {
          return { content: "", parsed: null };
        }
      } catch (requestError) {
        lastStatus = 504;
        lastProviderMessage = requestError instanceof Error ? requestError.message : "";
        const requestErrorName = requestError instanceof Error ? requestError.name : "";
        // Timeout tidak diulang karena percobaan kedua hanya membuat staff menunggu dua kali lebih lama.
        if (requestErrorName === "TimeoutError" || requestErrorName === "AbortError") {
          return {
            error: json({
              error: "Model AI tidak merespons dalam 32 detik. Silakan coba lagi atau pilih model yang lebih cepat.",
              provider_status: 504,
              retryable: true,
            }, 503),
          };
        }
        if (attemptNumber < maxAttempts && analysisDeadline - Date.now() > 6_000) {
          await delay(750 * attemptNumber);
          continue;
        }
      }
    }

    return {
      error: json({
        error: "Koneksi ke model AI terlalu lama atau terputus. Sistem sudah mencoba ulang; silakan coba lagi sebentar.",
        provider_status: lastStatus,
        retryable: true,
      }, 503),
    };
  };

  let attempt = await requestOpenRouter(baseMessages);
  if (attempt.error) return { response: attempt.error };
  if (!attempt.parsed) {
    const repairMessages = [
      ...baseMessages,
      ...(attempt.content ? [{ role: "assistant", content: attempt.content.slice(0, 50000) }] : []),
      { role: "user", content: "Perbaiki respons sebelumnya menjadi satu objek JSON valid sesuai struktur yang diminta. Pertahankan hasil analisis yang sama, ringkas, jangan gunakan markdown, dan jangan menambahkan kriteria matched=false." },
    ];
    // Percobaan perbaikan format hanya sekali agar total waktu tetap di bawah batas Edge Function.
    attempt = await requestOpenRouter(repairMessages, 1);
    if (attempt.error) return { response: attempt.error };
  }
  if (!attempt.parsed) {
    return { response: json({ error: "Model OpenRouter dua kali mengirim format JSON yang tidak lengkap. Coba kembali atau pilih model yang mendukung structured JSON." }, 502) };
  }
  const parsed = attempt.parsed as { questions?: Array<{ key?: unknown; criteria?: unknown; authorship?: unknown }> };

  const recommendations: Record<string, AiCriterion[]> = {};
  const scores: Record<string, number> = {};
  const authorship: Record<string, AiAuthorship> = {};
  for (const question of ESSAY_RUBRIC) {
    const received = parsed.questions?.find((item) => item?.key === question.key);
    const criteria = Array.isArray(received?.criteria) ? received.criteria : [];
    const answer = normalizeEvidence(answers[question.key]);
    const rawAuthorship = received?.authorship && typeof received.authorship === "object" ? received.authorship as Record<string, unknown> : {};
    const verdict = rawAuthorship.verdict === "likely_human" || rawAuthorship.verdict === "likely_ai" ? rawAuthorship.verdict : "uncertain";
    const authorConfidence: Confidence = rawAuthorship.confidence === "high" || rawAuthorship.confidence === "medium" ? rawAuthorship.confidence : "low";
    authorship[question.key] = {
      verdict,
      confidence: authorConfidence,
      reason: typeof rawAuthorship.reason === "string" ? rawAuthorship.reason.trim().slice(0, 240) : "",
    };
    recommendations[question.key] = question.criteria.map((_, index) => {
      const item = criteria.find((entry) => entry && typeof entry === "object" && (entry as Record<string, unknown>).index === index) as Record<string, unknown> | undefined;
      const confidence: Confidence = item?.confidence === "high" || item?.confidence === "medium" ? item.confidence : "low";
      const evidence = typeof item?.evidence === "string" ? item.evidence.trim().slice(0, 300) : "";
      const semanticReason = typeof item?.semantic_reason === "string" ? item.semantic_reason.trim() : "";
      const evidenceValid = evidence.length >= 12
        && evidence.split(/\s+/).length >= 3
        && answer.includes(normalizeEvidence(evidence));
      const semanticReasonValid = semanticReason.length >= 12;
      return {
        index,
        matched: item?.matched === true && evidenceValid && semanticReasonValid,
        confidence,
        evidence: evidenceValid ? evidence : "",
      };
    });
    scores[question.key] = recommendations[question.key].reduce((sum, item) =>
      sum + (item.matched && item.confidence === "high" ? (question.criteria[item.index]?.point ?? 0) : 0), 0);
  }
  return { result: { recommendations, authorship, scores, total_score: Object.values(scores).reduce((sum, score) => sum + score, 0), model } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, admin, authUser } = await authenticatedUser(req);
    if (!authUser) return json({ error: "Unauthorized" }, 401);
    const { data: staff } = await admin.from("staff_reviewers")
      .select("active,name").eq("user_id", authUser.id).maybeSingle();
    if (!staff?.active) return json({ error: "Akun staff tidak aktif" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");
    if (action === "chat_list") {
      const { data: messages, error: chatError } = await admin.from("staff_group_messages")
        .select("id,staff_user_id,staff_name,message,created_at")
        .order("created_at", { ascending: false }).limit(100);
      if (chatError) throw chatError;
      return json({ messages: (messages ?? []).reverse(), current_user_id: authUser.id });
    }
    if (action === "chat_send") {
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!message) return json({ error: "Pesan tidak boleh kosong" }, 400);
      if (message.length > 2000) return json({ error: "Pesan maksimal 2000 karakter" }, 400);
      const { data: sent, error: sendError } = await admin.from("staff_group_messages").insert({
        staff_user_id: authUser.id, staff_name: staff.name, message,
      }).select("id,staff_user_id,staff_name,message,created_at").single();
      if (sendError) throw sendError;
      return json({ message: sent, current_user_id: authUser.id });
    }
    if (action === "analyze") {
      const participantId = String(body.participant_id ?? "");
      if (!participantId) return json({ error: "Peserta tidak valid" }, 400);
      const analysis = await analyzeWithOpenRouter(admin, participantId);
      if (analysis.response) return analysis.response;
      const result = analysis.result!;
      const { error: saveAnalysisError } = await admin.from("participants").update({
        essay_ai_score: result.total_score,
        essay_ai_percent: result.total_score,
        essay_ai_verdict: null,
        essay_ai_summary: `STAFF_AI_JSON:${JSON.stringify(result)}`,
        essay_ai_graded_at: new Date().toISOString(),
      }).eq("id", participantId);
      if (saveAnalysisError) {
        console.error("Failed to persist staff AI analysis", saveAnalysisError);
        return json({ error: "Analisis selesai, tetapi hasilnya belum dapat disimpan. Silakan coba lagi." }, 500);
      }
      return json(result);
    }
    if (action === "list") {
      const { data, error } = await admin.rpc("list_essay_complete_participants");
      if (error) throw error;
      const participants = (data ?? []) as Participant[];
      const { data: reviews, error: reviewError } = await admin
        .from("staff_essay_reviews")
        .select("participant_id,reviewer_name,decision,scores,total_score,reviewer_notes,criteria_checks,review_method,reviewed_at,updated_at");
      if (reviewError) throw reviewError;
      const reviewMap = new Map((reviews ?? []).map((review) => [review.participant_id, review]));
      return json({ participants: participants.map((participant) => {
        const staffReview = reviewMap.get(participant.id) ?? null;
        return {
          ...participant,
          status: staffReview?.decision ?? "reviewed",
          staff_review: staffReview,
        };
      }) });
    }

    if (action === "reset_review") {
      const participantId = String(body.participant_id ?? "");
      if (!participantId) return json({ error: "Peserta tidak valid" }, 400);
      const { error: deleteError } = await admin.from("staff_essay_reviews")
        .delete().eq("participant_id", participantId);
      if (deleteError) throw deleteError;
      const nowIso = new Date().toISOString();
      const { error: resetError } = await admin.from("participants").update({
        essay_status: "pending",
        essay_updated_at: nowIso,
        tka_status: "pending",
        tka_updated_at: nowIso,
        interview_status: "pending",
        interview_updated_at: nowIso,
        updated_at: nowIso,
      }).eq("id", participantId);
      if (resetError) throw resetError;
      return json({ ok: true, review: null });
    }

    if (action === "update_status") {
      const participantId = String(body.participant_id ?? "");
      const status = String(body.status ?? "");
      const parsedScores = parseScores(body.scores);
      const reviewerNotes = typeof body.reviewer_notes === "string" ? body.reviewer_notes.trim() : "";
      const criteriaChecks = parseCriteriaChecks(body.criteria_checks);
      const reviewMethod = body.review_method === "ai" ? "ai" : "manual";
      if (!participantId || !["reviewed", "interview", "rejected"].includes(status)) {
        return json({ error: "Data keputusan tidak valid" }, 400);
      }
      if (!parsedScores) return json({ error: "Semua nilai wajib berupa angka 0 sampai 10" }, 400);
      if (!criteriaChecks) return json({ error: "Riwayat centang penilaian tidak valid" }, 400);
      const calculatedScores = Object.fromEntries(ESSAY_RUBRIC.map((question) => [
        question.key,
        criteriaChecks[question.key].reduce((sum, index) => sum + (question.criteria[index]?.point ?? 0), 0),
      ]));
      if (scoreKeys.some((key) => calculatedScores[key] !== parsedScores.scores[key])) return json({ error: "Nilai tidak sesuai dengan kriteria yang dicentang" }, 400);
      if (reviewerNotes.length > 2000) return json({ error: "Keterangan maksimal 2000 karakter" }, 400);
      const { data: participant, error: participantError } = await admin
        .rpc("list_essay_complete_participants");
      if (participantError) throw participantError;
      const eligible = ((participant ?? []) as Participant[])
        .some((row) => row.id === participantId);
      if (!eligible) return json({ error: "Essay dan Studi Kasus peserta belum lengkap" }, 400);
      const review = {
        participant_id: participantId,
        reviewer_id: authUser.id,
        reviewer_name: staff.name,
        decision: status,
        scores: parsedScores.scores,
        total_score: parsedScores.total,
        reviewer_notes: reviewerNotes || null,
        criteria_checks: criteriaChecks,
        review_method: reviewMethod,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error: auditError } = await admin.from("staff_essay_reviews").upsert(review, { onConflict: "participant_id" });
      if (auditError) throw auditError;
      const stageValue = status === "interview" ? "passed" : status === "rejected" ? "failed" : "pending";
      const nowIso = new Date().toISOString();
      const stagePatch: Record<string, unknown> = {
        essay_status: stageValue,
        essay_updated_at: nowIso,
        updated_at: nowIso,
      };
      if (stageValue !== "passed") {
        stagePatch.tka_status = "pending";
        stagePatch.tka_updated_at = nowIso;
        stagePatch.interview_status = "pending";
        stagePatch.interview_updated_at = nowIso;
      }
      const { error: stageError } = await admin
        .from("participants")
        .update(stagePatch)
        .eq("id", participantId);
      if (stageError) throw stageError;
      return json({ ok: true, review });
    }

    return json({ error: "Aksi tidak dikenal" }, 400);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "Terjadi kesalahan";
    return json({ error: message }, 500);
  }
});
