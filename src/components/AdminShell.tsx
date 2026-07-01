import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft, LayoutDashboard, Users, UserCheck, FileText, Settings, LogOut, Loader2,
  Route as RouteIcon, ClipboardList, MessageSquare, ChevronDown,
  Layers, Image as ImageIcon, Clock, BookOpen, HeartHandshake, Megaphone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarInset, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import logoSafarIman from "@/assets/logo-safar-iman.png";

type NavChild = { to: string; label: string };
type NavItem = { to: string; label: string; icon: any; exact?: boolean; children?: NavChild[] };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Manajemen Peserta",
    items: [
      { to: "/admin/peserta/reguler/pendaftaran", label: "Pendaftaran Reguler", icon: Users },
      { to: "/admin/peserta/reguler/berkas", label: "Berkas Reguler", icon: ClipboardList },
      { to: "/admin/peserta/self-funded/pendaftaran", label: "Pendaftaran Self Funded", icon: UserCheck },
      { to: "/admin/peserta/essay", label: "Berkas & Essay Studi Kasus", icon: FileText },
      { to: "/admin/peserta/kontribusi", label: "Kontribusi Valid", icon: HeartHandshake },
      { to: "/admin/peserta/tahapan", label: "Tahapan TKA & Interview", icon: Layers },
    ],
  },

  {
    label: "Konfigurasi",
    items: [
      {
        to: "/admin/pengaturan",
        label: "Pengaturan",
        icon: Settings,
        children: [
          { to: "/admin/pengaturan/gelombang", label: "Daftar Gelombang" },
          { to: "/admin/pengaturan/twibbon", label: "Twibbon & Poster" },
          { to: "/admin/pengaturan/countdown", label: "Countdown" },
          { to: "/admin/pengaturan/timeline", label: "Timeline Program" },
          { to: "/admin/pengaturan/panduan", label: "Panduan Link" },
          { to: "/admin/pengaturan/donasi", label: "Pembayaran & Donasi" },
          { to: "/admin/pengaturan/hasil-seleksi", label: "Hasil Seleksi" },
          { to: "/admin/pengaturan/dokumen-self-funded", label: "Dokumen Self Funded" },
          { to: "/admin/pengaturan/email", label: "Template Email" },
          { to: "/admin/pengaturan/wa-channel", label: "Link Saluran WhatsApp" },
          { to: "/admin/pengaturan/faq", label: "Halaman FAQ" },
          { to: "/admin/pengaturan/ai-provider", label: "AI Provider (WA & Essay)" },
          { to: "/admin/pengaturan/affiliate", label: "Affiliate Button" },


        ],
      },
    ],
  },
  {
    label: "Integrasi",
    items: [
      { to: "/admin/wa-setup", label: "WhatsApp & AI", icon: MessageSquare },
    ],
  },
  {
    label: "Alur Program",
    items: [
      { to: "/admin/alur/fully-funded", label: "Alur Fully Funded", icon: RouteIcon },
      { to: "/admin/alur/tahapan-seleksi", label: "Tahapan Seleksi (Poster)", icon: FileText },
    ],
  },
];


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
        <Link to="/admin" className="flex flex-col items-center gap-1.5 px-2 py-3">
          <img src={logoSafarIman} alt="Safar Iman" className="h-12 w-auto shrink-0 group-data-[collapsible=icon]:h-7" />
          <div className="text-[10px] tracking-[0.28em] uppercase text-muted-foreground font-medium group-data-[collapsible=icon]:hidden">
            Admin Panel
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((n) => {
                  const Icon = n.icon;
                  const active = isActive(n.to, !!n.exact);
                  if (n.children && n.children.length) {
                    const parentActive = loc.pathname.startsWith(n.to);
                    return (
                      <Collapsible key={n.to} defaultOpen={parentActive} className="group/collapsible">
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={n.label}
                              isActive={parentActive}
                              className={
                                "h-10 rounded-lg border transition-all " +
                                (parentActive
                                  ? "bg-gradient-emerald text-white border-transparent shadow-emerald hover:bg-gradient-emerald hover:text-white"
                                  : "bg-card border-border/70 hover:bg-accent/10 hover:border-accent/40 hover:shadow-sm")
                              }
                            >
                              <Icon className="size-4" />
                              <span className="font-medium flex-1 text-left">{n.label}</span>
                              <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="mt-1 ml-4 pl-3 border-l border-border/60 space-y-0.5">
                              {n.children.map((c) => {
                                const cActive = loc.pathname === c.to || loc.pathname.startsWith(c.to + "/");
                                return (
                                  <SidebarMenuSubItem key={c.to}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={cActive}
                                      className={
                                        "h-8 px-2.5 rounded-md text-sm truncate transition-colors " +
                                        (cActive
                                          ? "bg-accent/15 text-accent font-medium"
                                          : "text-muted-foreground hover:bg-accent/10 hover:text-foreground")
                                      }
                                    >
                                      <Link to={c.to} className="truncate">{c.label}</Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }
                  return (
                    <SidebarMenuItem key={n.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={n.label}
                        className={
                          "h-10 rounded-lg border transition-all " +
                          (active
                            ? "bg-gradient-emerald text-white border-transparent shadow-emerald hover:bg-gradient-emerald hover:text-white"
                            : "bg-card border-border/70 hover:bg-accent/10 hover:border-accent/40 hover:shadow-sm")
                        }
                      >
                        <Link to={n.to} className="flex items-center gap-2.5">
                          <Icon className="size-4" />
                          <span className="font-medium">{n.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Beranda" className="h-10 rounded-lg border border-border/70 bg-card hover:bg-accent/10 hover:border-accent/40">
              <Link to="/" className="flex items-center gap-2.5">
                <ArrowLeft className="size-4" />
                <span className="font-medium">Beranda</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Keluar" className="h-10 rounded-lg border border-red-200 dark:border-red-900/50 bg-card text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
              <LogOut className="size-4" />
              <span className="font-medium">Keluar</span>
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
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dashboard Admin</div>
              {title && (
                <>
                  <div className="text-muted-foreground/50">/</div>
                  <div className="text-sm font-semibold text-foreground truncate">{title}</div>
                </>
              )}
            </header>
            <main className="flex-1 px-4 sm:px-6 py-6 space-y-6">
              {title && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-accent uppercase tracking-[0.2em]">Admin Panel</div>
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
                </div>
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
