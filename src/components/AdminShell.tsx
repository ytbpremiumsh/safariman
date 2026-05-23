import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft, LayoutDashboard, Users, Settings, MessageCircle, LogOut, Sparkles, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import logoSafarIman from "@/assets/logo-safar-iman.png";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/peserta", label: "Peserta", icon: Users, exact: false },
  { to: "/admin/pengaturan", label: "Pengaturan", icon: Settings, exact: false },
  { to: "/admin/wa-setup", label: "WhatsApp & AI", icon: MessageCircle, exact: false },
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

function AdminSidebar() {
  const loc = useLocation();
  const navigate = useNavigate();
  const isActive = (to: string, exact: boolean) =>
    exact ? loc.pathname === to || loc.pathname === to + "/" : loc.pathname.startsWith(to);
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border">
        <Link to="/admin" className="flex items-center gap-2.5 px-2 py-2">
          <div className="size-9 shrink-0 rounded-xl bg-gradient-gold grid place-items-center shadow-gold">
            <Sparkles className="size-4 text-emerald-deep" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="font-display text-base font-semibold leading-tight">Safar Iman</div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground">Admin Panel</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((n) => {
                const Icon = n.icon;
                const active = isActive(n.to, n.exact);
                return (
                  <SidebarMenuItem key={n.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={n.label}>
                      <Link to={n.to} className="flex items-center gap-2.5">
                        <Icon className="size-4" />
                        <span>{n.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Beranda">
              <Link to="/" className="flex items-center gap-2.5">
                <ArrowLeft className="size-4" />
                <span>Beranda</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Keluar" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
              <LogOut className="size-4" />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="admin-theme">
      <SidebarProvider style={{ "--sidebar-width": "15rem" } as React.CSSProperties}>
        <div className="min-h-screen flex w-full bg-secondary/30">
          <AdminSidebar />
          <SidebarInset className="bg-secondary/30">
            <header className="h-14 flex items-center gap-2 border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10 px-3">
              <SidebarTrigger />
              <div className="h-5 w-px bg-border mx-1" />
              <div className="text-sm font-medium text-muted-foreground">Dashboard Admin</div>
            </header>
            <main className="flex-1 px-4 sm:px-6 py-6 space-y-6">
              {title && (
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
              )}
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export function AdminLoading() {
  return (
    <div className="min-h-screen grid place-items-center bg-secondary/30">
      <Loader2 className="size-8 animate-spin text-accent" />
    </div>
  );
}
