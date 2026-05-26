import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Lock, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IslamicPattern } from "@/components/IslamicPattern";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login — Safar Iman" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Akun dibuat. Cek email untuk verifikasi, lalu login.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Claim admin role if first user
        const { data: claimed } = await supabase.rpc("claim_admin_if_first");
        if (!claimed) {
          await supabase.auth.signOut();
          toast.error("Akun ini bukan admin.");
          return;
        }
        toast.success("Login berhasil!");
        navigate({ to: "/admin" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-deep via-emerald to-emerald-deep relative grid place-items-center px-4">
      <IslamicPattern className="absolute inset-0 size-full text-accent/10" />
      <Link to="/" className="absolute top-6 left-6 text-white/70 hover:text-white text-sm flex items-center gap-1.5">
        <ArrowLeft className="size-4" /> Beranda
      </Link>
      <div className="relative w-full max-w-md animate-fade-up">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5 text-white">
            <div className="size-10 rounded-xl bg-gradient-gold grid place-items-center shadow-gold">
              <Sparkles className="size-4 text-emerald-deep" />
            </div>
            <div className="text-left">
              <div className="font-display text-xl font-semibold leading-none">Safar Iman</div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-accent">Admin Panel</div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-3xl p-8 shadow-soft">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-10 rounded-xl bg-emerald/10 grid place-items-center text-emerald">
              <Lock className="size-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold">
                {mode === "login" ? "Masuk Admin" : "Daftar Admin"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {mode === "login" ? "Akses dashboard pendaftaran." : "Daftar admin pertama untuk bootstrap."}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@safariman.id" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>

          <button
            type="submit" disabled={busy}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-emerald text-accent px-6 py-3.5 text-sm font-bold shadow-emerald hover-lift disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : mode === "login" ? "Masuk" : "Daftar"}
          </button>

          {mode === "signup" && (
            <div className="mt-5 text-center text-xs text-muted-foreground">
              Sudah punya akun?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-accent font-semibold hover:underline">
                Login
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
