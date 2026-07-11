import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft, LayoutDashboard, Users, UserCheck, FileText, Settings, LogOut, Loader2,
  Route as RouteIcon, ClipboardList, MessageSquare, ChevronDown,
  Layers, Image as ImageIcon, Clock, BookOpen, HeartHandshake, Megaphone,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarInset, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import logoSafarIman from "@/assets/logo-safar-iman.png";


type NavChild = { to: string; label: string; keywords?: string };
type NavItem = { to: string; label: string; icon: any; exact?: boolean; keywords?: string; children?: NavChild[] };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true, keywords: "dashboard beranda ringkasan statistik home" },
    ],
  },
  {
    label: "Manajemen Peserta",
    items: [
      { to: "/admin/peserta/reguler/pendaftaran", label: "Pendaftaran Reguler", icon: Users, keywords: "peserta daftar registrasi fully funded gelombang" },
      { to: "/admin/peserta/reguler/berkas", label: "Berkas Reguler", icon: ClipboardList, keywords: "dokumen ktp paspor upload verifikasi berkas peserta" },
      { to: "/admin/peserta/self-funded/pendaftaran", label: "Pendaftaran Self Funded", icon: UserCheck, keywords: "mandiri bayar sendiri self funded peserta daftar" },
      { to: "/admin/peserta/essay", label: "Essay & Studi Kasus", icon: FileText, keywords: "essay tulisan studi kasus nilai grading ai" },
      { to: "/admin/peserta/kontribusi", label: "Kontribusi Valid", icon: HeartHandshake, keywords: "donasi kontribusi pembayaran valid mayar" },
      { to: "/admin/peserta/tahapan", label: "Tahapan TKA & Interview", icon: Layers, keywords: "tka test kesiapan awal interview wawancara tahap seleksi hasil" },
    ],
  },

  {
    label: "Konfigurasi",
    items: [
      {
        to: "/admin/pengaturan",
        label: "Pengaturan",
        icon: Settings,
        keywords: "settings konfigurasi",
        children: [
          { to: "/admin/pengaturan/gelombang", label: "Daftar Gelombang", keywords: "gelombang batch pendaftaran periode kuota" },
          { to: "/admin/pengaturan/twibbon", label: "Twibbon & Poster", keywords: "twibbon frame poster caption instagram whatsapp share bagikan sosial media" },
          { to: "/admin/pengaturan/countdown", label: "Countdown", keywords: "countdown hitung mundur timer deadline" },
          { to: "/admin/pengaturan/timeline", label: "Timeline Program", keywords: "timeline jadwal urutan tahap program" },
          { to: "/admin/pengaturan/panduan", label: "Panduan Link", keywords: "panduan guide link tutorial dokumen" },
          { to: "/admin/pengaturan/donasi", label: "Pembayaran & Donasi", keywords: "donasi pembayaran mayar invoice kontribusi" },
          { to: "/admin/pengaturan/hasil-seleksi", label: "Hasil Seleksi", keywords: "hasil pengumuman lolos seleksi publish" },
          { to: "/admin/pengaturan/dokumen-self-funded", label: "Dokumen Self Funded", keywords: "dokumen self funded mandiri persyaratan berkas" },
          { to: "/admin/pengaturan/email", label: "Template Email", keywords: "email template transactional smtp kirim notifikasi" },
          { to: "/admin/pengaturan/wa-channel", label: "Link Saluran WhatsApp", keywords: "whatsapp channel saluran link grup wa" },
          { to: "/admin/pengaturan/faq", label: "Halaman FAQ", keywords: "faq pertanyaan tanya jawab bantuan" },
          { to: "/admin/pengaturan/ai-provider", label: "AI Provider (WA & Essay)", keywords: "ai openai gemini provider kunci api essay wa" },
          { to: "/admin/pengaturan/affiliate", label: "Affiliate Button", keywords: "affiliate afiliasi tombol link referral" },
          { to: "/admin/pengaturan/apresiasi", label: "Apresiasi Peserta", keywords: "apresiasi testimoni peserta" },
          { to: "/admin/pengaturan/wa-quick-reply", label: "WA Quick Reply", keywords: "wa whatsapp quick reply balasan cepat template" },
        ],
      },
    ],
  },
  {
    label: "Integrasi",
    items: [
      { to: "/admin/wa-setup", label: "WhatsApp & AI", icon: MessageSquare, keywords: "whatsapp wa ai setup mpwa provider integrasi" },
    ],
  },
  {
    label: "Alur Program",
    items: [
      { to: "/admin/alur/fully-funded", label: "Alur Fully Funded", icon: RouteIcon, keywords: "alur fully funded program tahapan" },
      { to: "/admin/alur/tahapan-seleksi", label: "Tahapan Seleksi (Poster)", icon: FileText, keywords: "tahapan seleksi poster alur" },
    ],
  },
];

type FlatEntry = { to: string; label: string; group: string; parentLabel?: string; keywords: string };

function useSearchEntries(): FlatEntry[] {
  return useMemo(() => {
    const out: FlatEntry[] = [];
    for (const g of NAV_GROUPS) {
      for (const n of g.items) {
        out.push({ to: n.to, label: n.label, group: g.label, keywords: n.keywords ?? "" });
        if (n.children) {
          for (const c of n.children) {
            out.push({
              to: c.to,
              label: c.label,
              group: g.label,
              parentLabel: n.label,
              keywords: `${n.keywords ?? ""} ${c.keywords ?? ""}`.trim(),
            });
          }
        }
      }
    }
    return out;
  }, []);
}

function AdminSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const entries = useSearchEntries();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<string, FlatEntry[]>();
    for (const e of entries) {
      if (!m.has(e.group)) m.set(e.group, []);
      m.get(e.group)!.push(e);
    }
    return Array.from(m.entries());
  }, [entries]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground px-3 h-9 text-xs sm:text-sm transition-colors min-w-[180px] sm:min-w-[260px] justify-between"
        title="Cari menu (Ctrl/Cmd + K)"
      >
        <span className="inline-flex items-center gap-2">
          <Search className="size-3.5" />
          <span>Cari menu…</span>
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cari menu, fitur, atau kata kunci…" />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>
          {grouped.map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((e) => (
                <CommandItem
                  key={e.to}
                  value={`${e.label} ${e.parentLabel ?? ""} ${e.keywords} ${e.group}`}
                  onSelect={() => {
                    setOpen(false);
                    navigate({ to: e.to });
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {e.parentLabel && (
                        <span className="text-muted-foreground">{e.parentLabel} · </span>
                      )}
                      {e.label}
                    </span>
                    {e.keywords && (
                      <span className="text-[11px] text-muted-foreground line-clamp-1">
                        {e.keywords}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}



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
              <div className="ml-auto">
                <AdminSearch />
              </div>
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
