import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { staffSupabase } from "@/integrations/supabase/staff-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/staff/login")({
  head: () => ({ meta: [{ title: "Login Staff Seleksi — Safar Iman" }] }),
  component: StaffLogin,
});

function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await staffSupabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast.error("Email atau password staff tidak valid");
      setBusy(false);
      return;
    }
    const { error: accessError } = await staffSupabase.functions.invoke("staff-essay", { body: { action: "list" } });
    if (accessError) {
      await staffSupabase.auth.signOut();
      toast.error("Akun ini tidak memiliki akses staff atau sedang dinonaktifkan");
      setBusy(false);
      return;
    }
    navigate({ to: "/staff" });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-deep via-emerald to-emerald-deep grid place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-soft">
        <div className="size-12 rounded-2xl bg-accent/15 text-accent grid place-items-center mb-5"><LockKeyhole /></div>
        <h1 className="font-display text-2xl font-bold">Login Staff Seleksi</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">Masuk dengan akun yang dibuat oleh admin Safar Iman.</p>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Password</Label><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        </div>
        <button disabled={busy} className="mt-6 w-full rounded-full bg-gradient-emerald text-accent px-5 py-3 font-bold disabled:opacity-60">
          {busy ? <Loader2 className="size-4 animate-spin mx-auto" /> : "Masuk Dashboard Staff"}
        </button>
        <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-accent mt-5">Kembali ke beranda</Link>
      </form>
    </main>
  );
}
