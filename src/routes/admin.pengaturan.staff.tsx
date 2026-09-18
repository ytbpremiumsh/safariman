import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Loader2, Plus, Power, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AdminLoading, AdminShell, useAdminGuard } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/pengaturan/staff")({
  head: () => ({ meta: [{ title: "Akun Staff Seleksi — Safar Iman Admin" }] }), component: StaffSettings,
});
type Staff={user_id:string;name:string;email:string;active:boolean;created_at:string};
function StaffSettings(){
  const ready=useAdminGuard(); const [staff,setStaff]=useState<Staff[]>([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false);
  const [name,setName]=useState("");const [email,setEmail]=useState("");const [password,setPassword]=useState("");
  const invoke=async(body:Record<string,unknown>)=>{
    let {data:{session}}=await supabase.auth.getSession();
    if(!session?.access_token)throw new Error("Sesi admin berakhir. Silakan login ulang.");
    const expiresSoon = (session.expires_at ?? 0) * 1000 < Date.now() + 60_000;
    if(expiresSoon){
      const {data,error}=await supabase.auth.refreshSession();
      if(error||!data.session)throw new Error("Sesi admin berakhir. Silakan login ulang.");
      session=data.session;
    }
    const {data,error}=await supabase.functions.invoke("staff-management",{body,headers:{Authorization:`Bearer ${session.access_token}`}});
    if(error){
      let message=error.message;
      const response=(error as {context?:Response}).context;
      if(response){const payload=await response.clone().json().catch(()=>null) as {error?:string}|null;message=payload?.error||message;}
      throw new Error(message);
    }
    if(data?.error)throw new Error(data.error);
    return data;
  };
  const load=async()=>{setLoading(true);try{const data=await invoke({action:"list"});setStaff(data.staff??[]);}catch(e){toast.error(e instanceof Error?e.message:"Gagal memuat staff");}finally{setLoading(false);}};
  useEffect(()=>{if(ready)void load();},[ready]);
  const create=async(e:FormEvent)=>{e.preventDefault();setBusy(true);try{await invoke({action:"create",name,email,password});toast.success("Akun staff berhasil dibuat");setName("");setEmail("");setPassword("");await load();}catch(e){toast.error(e instanceof Error?e.message:"Gagal membuat akun");}finally{setBusy(false);}};
  const action=async(body:Record<string,unknown>,message:string)=>{setBusy(true);try{await invoke(body);toast.success(message);await load();}catch(e){toast.error(e instanceof Error?e.message:"Aksi gagal");}finally{setBusy(false);}};
  const resetPassword=(s:Staff)=>{const next=prompt(`Password baru untuk ${s.name} (minimal 8 karakter):`);if(next)void action({action:"reset_password",user_id:s.user_id,password:next},"Password diperbarui; sesi lama dikeluarkan");};
  if(!ready)return <AdminLoading/>;
  return <AdminShell title="Akun Staff Seleksi"><div className="space-y-6">
    <form onSubmit={create} className="bg-card border rounded-2xl p-6"><div className="flex items-center gap-2 mb-1"><UsersRound className="text-accent"/><h2 className="font-display text-xl font-bold">Buat Akun Staff</h2></div><p className="text-sm text-muted-foreground mb-5">Staff hanya dapat mengoreksi Essay & Studi Kasus. Staff tidak dapat mempublikasikan hasil.</p><div className="grid md:grid-cols-3 gap-4"><div><Label>Nama Staff</Label><Input required value={name} onChange={e=>setName(e.target.value)}/></div><div><Label>Email / Username</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div><div><Label>Password Awal</Label><Input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/></div></div><button disabled={busy} className="mt-4 rounded-lg bg-accent text-white px-5 py-2.5 font-bold inline-flex items-center gap-2">{busy?<Loader2 className="size-4 animate-spin"/>:<Plus className="size-4"/>}Buat Akun</button></form>
     <div className="bg-card border rounded-2xl overflow-hidden"><div className="p-4 border-b font-bold">Daftar Staff</div>{loading?<Loader2 className="animate-spin m-8"/>:<div className="divide-y">{staff.length===0?<p className="p-8 text-center text-muted-foreground">Belum ada akun staff.</p>:staff.map(s=><div key={s.user_id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><b>{s.name === "Rizky" ? "Rizky Arif" : s.name}</b><div className="text-sm text-muted-foreground">{s.email}</div><span className={`text-[10px] font-bold uppercase ${s.active?"text-emerald":"text-red-600"}`}>{s.active?"Aktif":"Nonaktif"}</span></div><div className="flex flex-wrap gap-2"><button disabled={busy} onClick={()=>resetPassword(s)} className="border rounded-lg px-3 py-2 text-xs flex gap-1"><KeyRound className="size-4"/>Reset Password</button><button disabled={busy} onClick={()=>action({action:"set_active",user_id:s.user_id,active:!s.active},s.active?"Akun dinonaktifkan":"Akun diaktifkan")} className="border rounded-lg px-3 py-2 text-xs flex gap-1"><Power className="size-4"/>{s.active?"Nonaktifkan":"Aktifkan"}</button><button disabled={busy} onClick={()=>confirm(`Hapus akun ${s.name}?`)&&action({action:"delete",user_id:s.user_id},"Akun staff dihapus")} className="border border-red-300 text-red-600 rounded-lg px-3 py-2 text-xs flex gap-1"><Trash2 className="size-4"/>Hapus</button></div></div>)}</div>}</div>
    <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-4 text-sm"><b>URL login staff:</b> <span className="font-mono">{window.location.origin}/staff/login</span></div>
  </div></AdminShell>;
}
