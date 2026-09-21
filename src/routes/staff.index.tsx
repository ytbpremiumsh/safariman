import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BriefcaseBusiness, CalendarClock, CheckCircle2, FileText, Loader2, LogOut, MessageSquareText, Search, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { staffSupabase } from "@/integrations/supabase/staff-client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ManualEssayReview, type AiReviewRecommendation, type ReviewChecks, type ReviewDecision, type ReviewScores } from "@/components/ManualEssayReview";
import { StaffGroupChat } from "@/components/StaffGroupChat";

export const Route = createFileRoute("/staff/")({
  head: () => ({ meta: [{ title: "Dashboard Staff Seleksi — Safar Iman" }] }),
  component: StaffDashboard,
});

type Status = "reviewed" | "interview" | "rejected";
type StaffReview={reviewer_name:string;decision:Status;scores:ReviewScores;total_score:number;reviewer_notes:string|null;criteria_checks:ReviewChecks|null;review_method:"manual"|"ai";reviewed_at:string;updated_at:string};
type Row = { id:string; updated_at:string; registration_code:string; full_name:string; email:string; whatsapp:string; city:string; education:string; occupation:string; category:string|null; status:Status; essay_worthy:string; essay_dream:string; essay_contribution:string; case_study_1:string|null; case_study_2:string|null; case_study_3:string|null; case_study_4:string|null; case_study_5:string|null; case_study_6:string|null; case_study_7:string|null; essay_ai_score:number|null; essay_ai_graded_at:string|null; staff_review:StaffReview|null };
const formatSubmissionDate = (value:string) => {
  const date=new Date(value);
  return Number.isNaN(date.getTime()) ? "Tanggal tidak tersedia" : new Intl.DateTimeFormat("id-ID",{dateStyle:"full",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(date)+" WIB";
};
const formatCompactSubmissionDate = (value:string) => {
  const date=new Date(value);
  return Number.isNaN(date.getTime()) ? "Tanggal tidak tersedia" : new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Jakarta"}).format(date);
};
const labels: Record<Status,string> = { reviewed:"Belum Diputuskan", interview:"Lolos Tahap Selanjutnya", rejected:"Tidak Lolos" };
const badges: Record<Status,string> = {
  reviewed:"bg-amber-100 text-amber-800 border-amber-300",
  interview:"bg-emerald text-primary-foreground border-emerald shadow-soft",
  rejected:"bg-destructive text-destructive-foreground border-destructive shadow-soft",
};

function StaffDashboard() {
  const navigate = useNavigate();
  const pageScrollRef=useRef(0);
  const [rows,setRows]=useState<Row[]>([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [analyzing,setAnalyzing]=useState(false);
  const [q,setQ]=useState(""); const [filter,setFilter]=useState<Status|"all">("all"); const [reviewerFilter,setReviewerFilter]=useState("all"); const [detail,setDetail]=useState<Row|null>(null);
  const [noteDetail,setNoteDetail]=useState<{participantName:string;registrationCode:string;reviewerName:string;notes:string;updatedAt:string}|null>(null);
  const [selectedIds,setSelectedIds]=useState<Set<string>>(new Set());
  const [batchAnalyzing,setBatchAnalyzing]=useState(false);
  const [batchProgress,setBatchProgress]=useState({done:0,total:0});
  const load = async () => {
    const { data:{ session } } = await staffSupabase.auth.getSession();
    if (!session) { navigate({to:"/staff/login"}); return; }
    const { data,error } = await staffSupabase.functions.invoke("staff-essay",{body:{action:"list"}});
    if (error) { toast.error("Akses staff tidak aktif"); navigate({to:"/staff/login"}); return; }
    setRows((data?.participants ?? []) as Row[]); setLoading(false);
  };
  useEffect(()=>{ void load(); },[]);
  const counts=useMemo(()=>({
    interview:rows.filter(r=>r.status==="interview").length,
    rejected:rows.filter(r=>r.status==="rejected").length,
    reviewed:rows.filter(r=>r.status==="reviewed").length,
  }),[rows]);
  const reviewers=useMemo(()=>Array.from(new Set(rows.map(r=>r.staff_review?.reviewer_name).filter((name):name is string=>Boolean(name)))).sort((a,b)=>a.localeCompare(b,"id-ID")),[rows]);
  const filtered=useMemo(()=>rows.filter(r=>
    (filter==="all"||r.status===filter)&&
    (reviewerFilter==="all"||(reviewerFilter==="__unreviewed__"?!r.staff_review:r.staff_review?.reviewer_name===reviewerFilter))&&
    (!q.trim()||[r.full_name,r.registration_code,r.email,r.city,r.staff_review?.reviewer_name].some(v=>v?.toLowerCase().includes(q.toLowerCase())))
  ).sort((a,b)=>{
      if(a.staff_review&&!b.staff_review)return -1;
      if(!a.staff_review&&b.staff_review)return 1;
      if(!a.staff_review&&!b.staff_review)return a.full_name.localeCompare(b.full_name,"id-ID");
      const at=new Date(a.staff_review!.updated_at).getTime();
      const bt=new Date(b.staff_review!.updated_at).getTime();
      return bt-at;
    }),[rows,q,filter,reviewerFilter]);
  const restorePageScroll=()=>{const top=pageScrollRef.current;requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top,behavior:"auto"})));};
  const openDetail=(row:Row)=>{pageScrollRef.current=window.scrollY;setDetail(row);};
  const closeDetail=()=>{setDetail(null);restorePageScroll();};
  const decide=async(status:ReviewDecision,scores:ReviewScores,reviewerNotes:string,criteriaChecks:ReviewChecks,reviewMethod:"manual"|"ai")=>{ if(!detail)return; setBusy(true); const {data,error}=await staffSupabase.functions.invoke("staff-essay",{body:{action:"update_status",participant_id:detail.id,status,scores,reviewer_notes:reviewerNotes,criteria_checks:criteriaChecks,review_method:reviewMethod}}); setBusy(false); if(error){toast.error(error.message);return;} const storedReview={...(data?.review??detail.staff_review),review_method:reviewMethod} as StaffReview; const next={...detail,status,staff_review:storedReview};setRows(v=>v.map(r=>r.id===detail.id?next:r));setDetail(next);restorePageScroll();toast.success(status==="interview"?"Keputusan disimpan dan peserta masuk Tahapan TKA.":"Penilaian dan keputusan berhasil disimpan."); };
  const resetReview=async()=>{ if(!detail)return; setBusy(true); const {error}=await staffSupabase.functions.invoke("staff-essay",{body:{action:"reset_review",participant_id:detail.id}}); setBusy(false); if(error){toast.error(error.message);return;} const next:Row={...detail,status:"reviewed",staff_review:null};setRows(v=>v.map(r=>r.id===detail.id?next:r));setDetail(next);restorePageScroll();toast.success("Penilaian direset — peserta kembali seperti semula."); };
  const requestAiAnalysis=async(participantId:string)=>{
    try{
      const {data:{session}}=await staffSupabase.auth.getSession();
      if(!session?.access_token)throw new Error("Sesi staff berakhir. Silakan login ulang.");
      const {data,error}=await staffSupabase.functions.invoke("staff-essay",{
        body:{action:"analyze",participant_id:participantId},
        headers:{Authorization:`Bearer ${session.access_token}`},
      });
      if(error){
        let message=error.message;
        const response=(error as {context?:Response}).context;
        if(response){const payload=await response.clone().json().catch(()=>null) as {error?:string;message?:string}|null;message=payload?.message||payload?.error||message;}
        throw new Error(message);
      }
      if(data?.error)throw new Error(data.error);
      return data as AiReviewRecommendation;
    }catch(error){throw error instanceof Error?error:new Error("Analisis AI gagal");}
  };
  const analyze=async()=>{
    if(!detail)return null;
    setAnalyzing(true);
    try{
      const result=await requestAiAnalysis(detail.id);
      const analyzedAt=new Date().toISOString();
      setRows(current=>current.map(row=>row.id===detail.id?{...row,essay_ai_score:result.total_score,essay_ai_graded_at:analyzedAt}:row));
      setDetail(current=>current?.id===detail.id?{...current,essay_ai_score:result.total_score,essay_ai_graded_at:analyzedAt}:current);
      toast.success("Rekomendasi selesai. Periksa bukti dan centang sebelum menyimpan.");
      return result;
    }catch(error){toast.error(error instanceof Error?error.message:"Analisis AI gagal");return null;}
    finally{setAnalyzing(false);}
  };
  const toggleSelected=(id:string)=>setSelectedIds(current=>{
    const next=new Set(current);
    if(next.has(id))next.delete(id);
    else if(next.size<10)next.add(id);
    else toast.warning("Maksimal 10 peserta dalam satu kali analisis.");
    return next;
  });
  const analyzeSelected=async()=>{
    const ids=Array.from(selectedIds).slice(0,10);
    if(ids.length===0)return;
    setBatchAnalyzing(true);setBatchProgress({done:0,total:ids.length});
    let success=0;let failed=0;
    for(const id of ids){
      try{
        const result=await requestAiAnalysis(id);
        const analyzedAt=new Date().toISOString();
        setRows(current=>current.map(row=>row.id===id?{...row,essay_ai_score:result.total_score,essay_ai_graded_at:analyzedAt}:row));
        success+=1;
      }catch{failed+=1;}
      setBatchProgress(current=>({...current,done:current.done+1}));
    }
    setBatchAnalyzing(false);
    setSelectedIds(new Set());
    if(success)toast.success(`${success} peserta berhasil dianalisis AI.`);
    if(failed)toast.error(`${failed} peserta gagal dianalisis. Silakan pilih dan coba kembali.`);
  };
  const logout=async()=>{await staffSupabase.auth.signOut();navigate({to:"/staff/login"});};
  if(loading)return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-accent"/></div>;
  return <div className="min-h-screen bg-secondary/30">
    <header className="sticky top-0 z-20 bg-card border-b"><div className="max-w-7xl mx-auto min-h-16 px-4 py-2 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><ShieldCheck className="text-accent"/><div><b>Dashboard Staff Seleksi</b><div className="text-[10px] text-muted-foreground">Essay & Studi Kasus · Tanpa akses publikasi</div></div></div><nav className="flex items-center gap-2"><Link to="/staff" className="rounded-lg bg-accent text-white px-3 py-2 text-xs font-semibold">Sudah Mengirim</Link><Link to="/staff/lolos" className="rounded-lg border px-3 py-2 text-xs font-semibold">Peserta Lolos</Link><button onClick={logout} className="flex items-center gap-1 text-sm ml-1"><LogOut className="size-4"/>Keluar</button></nav></div></header>
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Keputusan staff tersimpan sebagai hasil internal. Publikasi ke peserta tetap hanya dapat dilakukan oleh admin.</div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button onClick={()=>setFilter("interview")} className={`rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 text-left transition ${filter==="interview"?"border-emerald bg-emerald/10 ring-2 ring-emerald/20":"bg-card hover:border-emerald/50"}`}><div className="text-[10px] sm:text-xs font-semibold leading-tight text-muted-foreground">Lolos Tahap Selanjutnya</div><div className="mt-1 text-2xl sm:text-3xl font-bold text-emerald">{counts.interview}</div></button>
        <button onClick={()=>setFilter("rejected")} className={`rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 text-left transition ${filter==="rejected"?"border-destructive bg-destructive/10 ring-2 ring-destructive/20":"bg-card hover:border-destructive/50"}`}><div className="text-[10px] sm:text-xs font-semibold leading-tight text-muted-foreground">Tidak Lolos</div><div className="mt-1 text-2xl sm:text-3xl font-bold text-destructive">{counts.rejected}</div></button>
        <button onClick={()=>setFilter("reviewed")} className={`rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 text-left transition ${filter==="reviewed"?"border-amber-400 bg-amber-50 ring-2 ring-amber-200":"bg-card hover:border-amber-400"}`}><div className="text-[10px] sm:text-xs font-semibold leading-tight text-muted-foreground">Belum Diputuskan</div><div className="mt-1 text-2xl sm:text-3xl font-bold text-amber-700">{counts.reviewed}</div></button>
      </div>
      <div className="bg-card border rounded-xl p-3 grid md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_240px] gap-2.5">
        <div className="relative md:col-span-2 lg:col-span-1"><Search className="absolute size-4 left-3 top-3 text-muted-foreground"/><Input className="pl-9" placeholder="Cari nama, token, email, kota, atau pengoreksi" value={q} onChange={e=>setQ(e.target.value)}/></div>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={filter} onChange={e=>setFilter(e.target.value as Status|"all")}><option value="all">Semua Hasil</option><option value="reviewed">Belum Diputuskan</option><option value="interview">Lolos Tahap Selanjutnya</option><option value="rejected">Tidak Lolos</option></select>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={reviewerFilter} onChange={e=>setReviewerFilter(e.target.value)}><option value="all">Semua Staff Pengoreksi</option><option value="__unreviewed__">Belum Ada Pengoreksi</option>{reviewers.map(name=><option key={name} value={name}>{name}</option>)}</select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Menampilkan <b className="text-foreground">{filtered.length}</b> dari {rows.length} peserta · <b className="text-foreground">{selectedIds.size}</b>/10 dipilih</span>
        <div className="flex items-center gap-2">
          {(filter!=="all"||reviewerFilter!=="all"||q)&&<button onClick={()=>{setFilter("all");setReviewerFilter("all");setQ("");}} className="font-semibold text-accent hover:underline">Reset Filter</button>}
          <button type="button" disabled={selectedIds.size===0||batchAnalyzing} onClick={()=>void analyzeSelected()} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
            {batchAnalyzing?<Loader2 className="size-4 animate-spin"/>:<Sparkles className="size-4"/>}
            {batchAnalyzing?`Menganalisis ${batchProgress.done}/${batchProgress.total}`:`Analisis AI (${selectedIds.size})`}
          </button>
        </div>
      </div>
      <div className="bg-card border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60"><tr><th className="w-10 p-3 text-center">Pilih</th><th className="text-left p-3">Peserta</th><th className="text-left p-3">Kontak</th><th className="text-left p-3">Status</th><th className="text-left p-3">Nilai</th><th className="text-left p-3">Staff Pengoreksi</th><th className="p-3"></th></tr></thead>
          <tbody>{filtered.map(r=><tr key={r.id} className={`border-t ${selectedIds.has(r.id)?"bg-violet-50/70":""}`}>
            <td className="p-3 text-center"><input type="checkbox" aria-label={`Pilih ${r.full_name}`} checked={selectedIds.has(r.id)} disabled={batchAnalyzing||(!selectedIds.has(r.id)&&selectedIds.size>=10)} onChange={()=>toggleSelected(r.id)} className="size-4 accent-violet-600"/></td>
            <td className="p-3"><b>{r.full_name}</b><div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"><span className="font-mono">{r.registration_code}</span><span aria-hidden="true">|</span><span className="text-[11px]">{formatCompactSubmissionDate(r.updated_at)}</span></div></td>
            <td className="p-3 text-xs">{r.email}<div>{r.whatsapp}</div></td>
            <td className="p-3"><span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badges[r.status]}`}>{labels[r.status]}</span></td>
            <td className="p-3"><div className="font-bold">{r.essay_ai_graded_at&&r.essay_ai_score!=null?`${r.essay_ai_score}/100`:r.staff_review?`${r.staff_review.total_score}/100`:"—"}</div>{r.essay_ai_graded_at&&<span className="mt-1 inline-flex items-center gap-1 rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[9px] font-bold text-violet-700"><Sparkles className="size-2.5"/>Sudah Dianalisis AI</span>}{r.staff_review&&r.essay_ai_graded_at&&<div className="mt-1 text-[10px] text-muted-foreground">Nilai staff: {r.staff_review.total_score}/100</div>}</td>
            <td className="p-3 text-xs"><b>{r.staff_review?.reviewer_name||"Belum dikoreksi"}</b>{r.staff_review&&<div className="text-muted-foreground">{new Date(r.staff_review.updated_at).toLocaleString("id-ID")}</div>}{r.staff_review?.reviewer_notes?.trim()&&<button type="button" onClick={()=>setNoteDetail({participantName:r.full_name,registrationCode:r.registration_code,reviewerName:r.staff_review!.reviewer_name,notes:r.staff_review!.reviewer_notes!.trim(),updatedAt:r.staff_review!.updated_at})} className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 transition hover:bg-sky-100"><MessageSquareText className="size-3"/>Ada Catatan</button>}</td>
            <td className="p-3 text-right"><button onClick={()=>openDetail(r)} className="rounded-lg bg-accent text-primary-foreground px-3 py-2 inline-flex gap-1"><FileText className="size-4"/>Koreksi</button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </main>
    <StaffGroupChat />
    <Dialog open={!!noteDetail} onOpenChange={open=>!open&&setNoteDetail(null)}>
      <DialogContent className="max-w-lg">
        {noteDetail&&<>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageSquareText className="size-5 text-sky-600"/>Keterangan Pengoreksi</DialogTitle>
            <DialogDescription>{noteDetail.participantName} · {noteDetail.registrationCode}</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">{noteDetail.notes}</div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>Dicatat oleh <b className="text-foreground">{noteDetail.reviewerName}</b></span><span>{new Date(noteDetail.updatedAt).toLocaleString("id-ID")}</span></div>
        </>}
      </DialogContent>
    </Dialog>
    <Dialog open={!!detail} onOpenChange={o=>!o&&closeDetail()}><DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">{detail&&<><DialogHeader><DialogTitle>{detail.full_name} · {detail.registration_code}</DialogTitle><div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground"><div className="flex items-center gap-1.5"><BriefcaseBusiness className="size-3.5"/><span>Pekerjaan: <b className="text-foreground font-medium">{detail.occupation?.trim()||"Belum diisi"}</b></span></div><div className="flex items-center gap-1.5"><CalendarClock className="size-3.5"/><span>Dikirim: {formatSubmissionDate(detail.updated_at)}</span></div></div></DialogHeader><ManualEssayReview answers={{essay_1:detail.essay_worthy,essay_2:detail.essay_dream,essay_3:detail.essay_contribution,case_1:detail.case_study_1,case_2:detail.case_study_2,case_3:detail.case_study_3,case_4:detail.case_study_4,case_5:detail.case_study_5,case_6:detail.case_study_6,case_7:detail.case_study_7}} initialScores={detail.staff_review?.scores} initialChecks={detail.staff_review?.criteria_checks} initialMethod={detail.staff_review?.review_method} initialNotes={detail.staff_review?.reviewer_notes} currentDecision={detail.status} busy={busy} analyzing={analyzing} onAnalyze={analyze} onSave={decide} onReset={resetReview}/></>}</DialogContent></Dialog>
  </div>;
}
