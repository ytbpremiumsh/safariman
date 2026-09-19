import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Loader2, LogOut, Search, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { staffSupabase } from "@/integrations/supabase/staff-client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ManualEssayReview, type AiReviewRecommendation, type ReviewDecision, type ReviewScores } from "@/components/ManualEssayReview";

export const Route = createFileRoute("/staff/")({
  head: () => ({ meta: [{ title: "Dashboard Staff Seleksi — Safar Iman" }] }),
  component: StaffDashboard,
});

type Status = "reviewed" | "interview" | "rejected";
type StaffReview={reviewer_name:string;decision:Status;scores:ReviewScores;total_score:number;reviewer_notes:string|null;reviewed_at:string;updated_at:string};
type Row = { id:string; registration_code:string; full_name:string; email:string; whatsapp:string; city:string; education:string; occupation:string; category:string|null; status:Status; essay_worthy:string; essay_dream:string; essay_contribution:string; case_study_1:string|null; case_study_2:string|null; case_study_3:string|null; case_study_4:string|null; case_study_5:string|null; case_study_6:string|null; case_study_7:string|null; staff_review:StaffReview|null };
const labels: Record<Status,string> = { reviewed:"Belum Diputuskan", interview:"Lolos Tahap Selanjutnya", rejected:"Tidak Lolos" };
const badges: Record<Status,string> = {
  reviewed:"bg-amber-100 text-amber-800 border-amber-300",
  interview:"bg-emerald text-primary-foreground border-emerald shadow-soft",
  rejected:"bg-destructive text-destructive-foreground border-destructive shadow-soft",
};

function StaffDashboard() {
  const navigate = useNavigate();
  const [rows,setRows]=useState<Row[]>([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [analyzing,setAnalyzing]=useState(false);
  const [q,setQ]=useState(""); const [filter,setFilter]=useState<Status|"all">("all"); const [reviewerFilter,setReviewerFilter]=useState("all"); const [detail,setDetail]=useState<Row|null>(null);
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
      if(!a.staff_review&&b.staff_review)return -1;
      if(a.staff_review&&!b.staff_review)return 1;
      if(!a.staff_review&&!b.staff_review)return a.full_name.localeCompare(b.full_name,"id-ID");
      const at=new Date(a.staff_review!.updated_at).getTime();
      const bt=new Date(b.staff_review!.updated_at).getTime();
      return bt-at;
    }),[rows,q,filter,reviewerFilter]);
  const decide=async(status:ReviewDecision,scores:ReviewScores,reviewerNotes:string)=>{ if(!detail)return; setBusy(true); const {data,error}=await staffSupabase.functions.invoke("staff-essay",{body:{action:"update_status",participant_id:detail.id,status,scores,reviewer_notes:reviewerNotes}}); setBusy(false); if(error){toast.error(error.message);return;} const next={...detail,status,staff_review:data?.review??detail.staff_review};setRows(v=>v.map(r=>r.id===detail.id?next:r));setDetail(next);toast.success(status==="interview"?"Keputusan disimpan dan peserta masuk Tahapan TKA.":"Penilaian dan keputusan berhasil disimpan."); };
  const resetReview=async()=>{ if(!detail)return; setBusy(true); const {error}=await staffSupabase.functions.invoke("staff-essay",{body:{action:"reset_review",participant_id:detail.id}}); setBusy(false); if(error){toast.error(error.message);return;} const next:Row={...detail,status:"reviewed",staff_review:null};setRows(v=>v.map(r=>r.id===detail.id?next:r));setDetail(next);toast.success("Penilaian direset — peserta kembali seperti semula."); };
  const analyze=async()=>{
    if(!detail)return null;
    setAnalyzing(true);
    try{
      const {data:{session}}=await staffSupabase.auth.getSession();
      if(!session?.access_token)throw new Error("Sesi staff berakhir. Silakan login ulang.");
      const {data,error}=await staffSupabase.functions.invoke("staff-essay",{
        body:{action:"analyze",participant_id:detail.id},
        headers:{Authorization:`Bearer ${session.access_token}`},
      });
      if(error){
        let message=error.message;
        const response=(error as {context?:Response}).context;
        if(response){const payload=await response.clone().json().catch(()=>null) as {error?:string;message?:string}|null;message=payload?.message||payload?.error||message;}
        throw new Error(message);
      }
      if(data?.error)throw new Error(data.error);
      toast.success("Rekomendasi selesai. Periksa bukti dan centang sebelum menyimpan.");
      return data as AiReviewRecommendation;
    }catch(error){
      toast.error(error instanceof Error?error.message:"Analisis AI gagal");
      return null;
    }finally{setAnalyzing(false);}
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
      <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Menampilkan <b className="text-foreground">{filtered.length}</b> dari {rows.length} peserta</span>{(filter!=="all"||reviewerFilter!=="all"||q)&&<button onClick={()=>{setFilter("all");setReviewerFilter("all");setQ("");}} className="font-semibold text-accent hover:underline">Reset Filter</button>}</div>
      <div className="bg-card border rounded-2xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-secondary/60"><tr><th className="text-left p-3">Peserta</th><th className="text-left p-3">Kontak</th><th className="text-left p-3">Status</th><th className="text-left p-3">Nilai</th><th className="text-left p-3">Staff Pengoreksi</th><th className="p-3"></th></tr></thead><tbody>{filtered.map(r=><tr key={r.id} className="border-t"><td className="p-3"><b>{r.full_name}</b><div className="text-xs font-mono text-muted-foreground">{r.registration_code}</div></td><td className="p-3 text-xs">{r.email}<div>{r.whatsapp}</div></td><td className="p-3"><span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badges[r.status]}`}>{labels[r.status]}</span></td><td className="p-3 font-bold">{r.staff_review?`${r.staff_review.total_score}/100`:"—"}</td><td className="p-3 text-xs"><b>{r.staff_review?.reviewer_name||"Belum dikoreksi"}</b>{r.staff_review&&<div className="text-muted-foreground">{new Date(r.staff_review.updated_at).toLocaleString("id-ID")}</div>}</td><td className="p-3 text-right"><button onClick={()=>setDetail(r)} className="rounded-lg bg-accent text-primary-foreground px-3 py-2 inline-flex gap-1"><FileText className="size-4"/>Koreksi</button></td></tr>)}</tbody></table></div>
    </main>
    <Dialog open={!!detail} onOpenChange={o=>!o&&setDetail(null)}><DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">{detail&&<><DialogHeader><DialogTitle>{detail.full_name} · {detail.registration_code}</DialogTitle></DialogHeader><ManualEssayReview answers={{essay_1:detail.essay_worthy,essay_2:detail.essay_dream,essay_3:detail.essay_contribution,case_1:detail.case_study_1,case_2:detail.case_study_2,case_3:detail.case_study_3,case_4:detail.case_study_4,case_5:detail.case_study_5,case_6:detail.case_study_6,case_7:detail.case_study_7}} initialScores={detail.staff_review?.scores} initialNotes={detail.staff_review?.reviewer_notes} currentDecision={detail.status} busy={busy} analyzing={analyzing} onAnalyze={analyze} onSave={decide} onReset={resetReview}/></>}</DialogContent></Dialog>
  </div>;
}
