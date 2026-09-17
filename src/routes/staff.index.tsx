import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Loader2, LogOut, Search, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/staff/")({
  head: () => ({ meta: [{ title: "Dashboard Staff Seleksi — Safar Iman" }] }),
  component: StaffDashboard,
});

type Status = "reviewed" | "interview" | "rejected";
type Row = { id:string; registration_code:string; full_name:string; email:string; whatsapp:string; city:string; education:string; occupation:string; category:string|null; status:Status; essay_worthy:string; essay_dream:string; essay_contribution:string; case_study_1:string|null; case_study_2:string|null; case_study_3:string|null; case_study_4:string|null; case_study_5:string|null; case_study_6:string|null; case_study_7:string|null };
const labels: Record<Status,string> = { reviewed:"Belum Diputuskan", interview:"Lolos Tahap Selanjutnya", rejected:"Tidak Lolos" };

function StaffDashboard() {
  const navigate = useNavigate();
  const [rows,setRows]=useState<Row[]>([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false);
  const [q,setQ]=useState(""); const [filter,setFilter]=useState<Status|"all">("all"); const [detail,setDetail]=useState<Row|null>(null);
  const load = async () => {
    const { data:{ session } } = await supabase.auth.getSession();
    if (!session) { navigate({to:"/staff/login"}); return; }
    const { data,error } = await supabase.functions.invoke("staff-essay",{body:{action:"list"}});
    if (error) { await supabase.auth.signOut(); toast.error("Akses staff tidak aktif"); navigate({to:"/staff/login"}); return; }
    setRows((data?.participants ?? []) as Row[]); setLoading(false);
  };
  useEffect(()=>{ void load(); },[]);
  const filtered=useMemo(()=>rows.filter(r=>(filter==="all"||r.status===filter)&&(!q.trim()||[r.full_name,r.registration_code,r.email,r.city].some(v=>v?.toLowerCase().includes(q.toLowerCase())))),[rows,q,filter]);
  const decide=async(status:Status)=>{ if(!detail)return; setBusy(true); const {error}=await supabase.functions.invoke("staff-essay",{body:{action:"update_status",participant_id:detail.id,status}}); setBusy(false); if(error){toast.error(error.message);return;} const next={...detail,status};setRows(v=>v.map(r=>r.id===detail.id?next:r));setDetail(next);toast.success("Keputusan berhasil disimpan. Hasil belum dipublikasikan."); };
  const logout=async()=>{await supabase.auth.signOut();navigate({to:"/staff/login"});};
  if(loading)return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-accent"/></div>;
  return <div className="min-h-screen bg-secondary/30">
    <header className="sticky top-0 z-20 bg-card border-b"><div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between"><div className="flex items-center gap-2"><ShieldCheck className="text-accent"/><div><b>Dashboard Staff Seleksi</b><div className="text-[10px] text-muted-foreground">Essay & Studi Kasus · Tanpa akses publikasi</div></div></div><button onClick={logout} className="flex items-center gap-1 text-sm"><LogOut className="size-4"/>Keluar</button></div></header>
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Keputusan staff tersimpan sebagai hasil internal. Publikasi ke peserta tetap hanya dapat dilakukan oleh admin.</div>
      <div className="bg-card border rounded-2xl p-4 flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="absolute size-4 left-3 top-3 text-muted-foreground"/><Input className="pl-9" placeholder="Cari nama, token, email, kota" value={q} onChange={e=>setQ(e.target.value)}/></div><select className="h-10 rounded-md border bg-background px-3 text-sm" value={filter} onChange={e=>setFilter(e.target.value as Status|"all")}><option value="all">Semua Hasil</option><option value="reviewed">Belum Diputuskan</option><option value="interview">Lolos</option><option value="rejected">Tidak Lolos</option></select></div>
      <div className="bg-card border rounded-2xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-secondary/60"><tr><th className="text-left p-3">Peserta</th><th className="text-left p-3">Kontak</th><th className="text-left p-3">Status</th><th className="p-3"></th></tr></thead><tbody>{filtered.map(r=><tr key={r.id} className="border-t"><td className="p-3"><b>{r.full_name}</b><div className="text-xs font-mono text-muted-foreground">{r.registration_code}</div></td><td className="p-3 text-xs">{r.email}<div>{r.whatsapp}</div></td><td className="p-3 text-xs font-semibold">{labels[r.status]}</td><td className="p-3 text-right"><button onClick={()=>setDetail(r)} className="rounded-lg bg-accent text-white px-3 py-2 inline-flex gap-1"><FileText className="size-4"/>Koreksi</button></td></tr>)}</tbody></table></div>
    </main>
    <Dialog open={!!detail} onOpenChange={o=>!o&&setDetail(null)}><DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">{detail&&<><DialogHeader><DialogTitle>{detail.full_name} · {detail.registration_code}</DialogTitle></DialogHeader><div className="grid lg:grid-cols-[1fr,260px] gap-5"><div className="space-y-4"><Answer title="Essay 1 — Kenapa layak dipilih?" text={detail.essay_worthy}/><Answer title="Essay 2 — Mimpi setelah Umrah" text={detail.essay_dream}/><Answer title="Essay 3 — Kontribusi untuk umat" text={detail.essay_contribution}/>{[1,2,3,4,5,6,7].map(n=><Answer key={n} title={`Studi Kasus ${n}`} text={(detail as any)[`case_study_${n}`]}/>)}</div><aside className="space-y-3"><div className="rounded-xl bg-secondary p-4 text-sm"><b>Keputusan saat ini</b><div className="mt-1">{labels[detail.status]}</div></div><button disabled={busy} onClick={()=>decide("interview")} className="w-full rounded-lg bg-emerald text-white py-3 font-bold flex justify-center gap-2"><CheckCircle2 className="size-5"/>Lolos</button><button disabled={busy} onClick={()=>decide("rejected")} className="w-full rounded-lg bg-red-500 text-white py-3 font-bold flex justify-center gap-2"><XCircle className="size-5"/>Tidak Lolos</button><button disabled={busy} onClick={()=>decide("reviewed")} className="w-full rounded-lg border py-2 font-semibold">Reset Belum Diputuskan</button></aside></div></>}</DialogContent></Dialog>
  </div>;
}
function Answer({title,text}:{title:string;text:string|null}){return <section><h3 className="text-xs font-bold text-accent mb-1">{title}</h3><div className="rounded-xl border bg-secondary/20 p-4 whitespace-pre-wrap text-sm leading-relaxed">{text||"—"}</div></section>}

