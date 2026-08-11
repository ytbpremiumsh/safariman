import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  ShieldCheck, Loader2, Plus, Trash2, Copy, Check, Clock, AlertCircle, 
  ExternalLink, Key
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminLoading, useAdminGuard } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const Route = createFileRoute("/admin/pengaturan/seleksi-private")({
  head: () => ({ meta: [{ title: "Akses Seleksi Private — Safar Iman Admin" }] }),
  component: SeleksiPrivateSettings,
});

type Token = {
  id: string;
  token: string;
  created_at: string | null;
  expires_at: string;
};

function SeleksiPrivateSettings() {
  const ready = useAdminGuard();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expiryDays, setExpiryDays] = useState("7");
  const [copying, setCopying] = useState<string | null>(null);

  useEffect(() => {
    if (ready) void fetchTokens();
  }, [ready]);

  const fetchTokens = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("seleksi_private_tokens")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) toast.error(error.message);
    else setTokens(data || []);
    setLoading(false);
  };

  const createToken = async () => {
    setCreating(true);
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));

    const { error } = await supabase
      .from("seleksi_private_tokens")
      .insert({
        token,
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Token akses berhasil dibuat");
      void fetchTokens();
    }
    setCreating(false);
  };

  const deleteToken = async (id: string) => {
    const { error } = await supabase
      .from("seleksi_private_tokens")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Token berhasil dihapus");
      setTokens(t => t.filter(x => x.id !== id));
    }
  };

  const copyUrl = (token: string) => {
    const url = `${window.location.origin}/seleksi/essay?token=${token}`;
    void navigator.clipboard.writeText(url);
    setCopying(token);
    toast.success("Link seleksi berhasil disalin");
    setTimeout(() => setCopying(null), 2000);
  };

  if (!ready) return <AdminLoading />;

  return (
    <AdminShell title="Akses Seleksi Private">
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Key className="size-5 text-accent" />
                Generate Token Akses
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg">
                Buat link akses khusus untuk tim penyeleksi. Link ini tidak memerlukan login admin dan akan kadaluarsa sesuai waktu yang ditentukan.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Masa Berlaku (Hari)</label>
                <Input 
                  type="number" 
                  value={expiryDays} 
                  onChange={(e) => setExpiryDays(e.target.value)} 
                  className="w-24"
                  min="1"
                  max="365"
                />
              </div>
              <Button 
                onClick={createToken} 
                disabled={creating}
                className="self-end bg-accent hover:bg-accent/90 text-white rounded-xl h-10 px-6 font-bold"
              >
                {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4 mr-2" />}
                Buat Link Baru
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-secondary/30">
            <h3 className="font-bold text-sm uppercase tracking-wider">Daftar Link Aktif</h3>
          </div>
          
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="size-8 animate-spin text-accent/50" />
              </div>
            ) : tokens.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="size-12 bg-secondary rounded-full grid place-items-center mx-auto">
                  <ShieldCheck className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Belum ada token akses yang dibuat.</p>
              </div>
            ) : tokens.map((t) => {
              const isExpired = new Date(t.expires_at) < new Date();
              return (
                <div key={t.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded truncate max-w-[200px]">
                        {t.token}
                      </span>
                      {isExpired ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-600 px-2 py-0.5 rounded">Kadaluarsa</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald/10 text-emerald px-2 py-0.5 rounded">Aktif</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> Dibuat: {t.created_at ? format(new Date(t.created_at), "d MMM yyyy HH:mm", { locale: id }) : "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertCircle className="size-3" /> Berakhir: {format(new Date(t.expires_at), "d MMM yyyy HH:mm", { locale: id })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyUrl(t.token)}
                      className="rounded-lg h-9 border-accent/20 text-accent hover:bg-accent hover:text-white"
                    >
                      {copying === t.token ? <Check className="size-4 mr-2" /> : <Copy className="size-4 mr-2" />}
                      Salin Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/seleksi/essay?token=${t.token}`, '_blank')}
                      className="rounded-lg h-9"
                    >
                      <ExternalLink className="size-4 mr-2" /> Buka
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Hapus token akses ini?")) deleteToken(t.id);
                      }}
                      className="rounded-lg h-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-bold">Informasi Keamanan:</p>
            <p>
              Halaman seleksi private dirancang agar tim eksternal dapat melakukan grading tanpa akses dashboard utama. 
              Siapapun yang memiliki link ini dapat melihat data Essai, Studi Kasus, dan kontak peserta. 
              Harap hapus token jika sudah tidak digunakan.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
