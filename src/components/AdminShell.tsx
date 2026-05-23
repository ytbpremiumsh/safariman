import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, LayoutDashboard, Users, Settings, MessageCircle, LogOut, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/peserta", label: "Peserta", icon: Users, exact: false },
  { to: "/admin/pengaturan", label: "Pengaturan", icon: Settings, exact: false },
  { to: "/admin/wa-setup", label: "WA Setup", icon: MessageCircle, exact: false },
] as const;

export function useAdminGuard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/admin/login" }); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      if (!isAdmin) { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); return; }
      setReady(true);
    })();
  }, [navigate]);
  return ready;
}

export function AdminShell({ children, title }: { children: ReactNode; title?: string }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); };

  const isActive = (to: string, exact: boolean) =>
    exact ? loc.pathname === to || loc.pathname === to + "/" : loc.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-emerald-deep text-white sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-gold grid place-items-center">
              <Sparkles className="size-4 text-emerald-deep" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold leading-none">Safar Iman</div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-accent">Dashboard Admin</div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/" className="text-sm text-white/70 hover:text-white flex items-center gap-1.5 px-3 py-2">
              <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Beranda</span>
            </Link>
            <button onClick={signOut} className="text-sm text-white/90 hover:text-white inline-flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/10">
              <LogOut className="size-4" /> Keluar
            </button>
          </div>
        </div>
        <nav className="border-t border-white/10 bg-emerald-deep/95">
          <div className="mx-auto max-w-7xl px-2 sm:px-4 flex gap-1 overflow-x-auto">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = isActive(n.to, n.exact);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm border-b-2 whitespace-nowrap transition ${
                    active
                      ? "border-accent text-accent font-semibold"
                      : "border-transparent text-white/70 hover:text-white"
                  }`}
                >
                  <Icon className="size-4" /> {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      {title && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">{title}</h1>
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">{children}</main>
    </div>
  );
}

export function AdminLoading() {
  return (
    <div className="min-h-screen grid place-items-center">
      <Loader2 className="size-8 animate-spin text-accent" />
    </div>
  );
}
