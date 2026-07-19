import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, DatabaseBackup, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function BackupReminderBanner() {
  const [show, setShow] = useState(false);
  const [days, setDays] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Session-scoped dismiss
        if (sessionStorage.getItem("admin_backup_reminder_dismissed") === "1") return;

        const { data } = await supabase
          .from("app_settings")
          .select("key,value")
          .in("key", ["backup_reminder_enabled", "backup_reminder_days", "backup_last_at"]);
        if (!alive) return;
        const m = new Map((data ?? []).map((r: any) => [r.key, r.value]));
        const enabled = (m.get("backup_reminder_enabled") ?? "true") !== "false";
        if (!enabled) return;
        const thresholdDays = Math.max(1, parseInt(m.get("backup_reminder_days") ?? "7", 10) || 7);
        const lastAt = m.get("backup_last_at");
        const lastTs = lastAt ? new Date(lastAt).getTime() : 0;
        const diffDays = lastTs
          ? Math.floor((Date.now() - lastTs) / (1000 * 60 * 60 * 24))
          : 9999;
        if (diffDays >= thresholdDays) {
          setDays(diffDays >= 9999 ? -1 : diffDays);
          setShow(true);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!show) return null;

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 p-4 flex items-start gap-3">
      <div className="size-9 rounded-lg bg-amber-500/20 grid place-items-center shrink-0">
        <AlertTriangle className="size-5" />
      </div>
      <div className="flex-1 text-sm">
        <div className="font-semibold">Waktunya backup database</div>
        <div className="opacity-90">
          {days < 0
            ? "Belum ada backup yang tercatat. Segera unduh cadangan database untuk mengamankan data peserta."
            : `Backup terakhir sudah ${days} hari lalu. Segera unduh cadangan database.`}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            to="/admin/pengaturan/backup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-amber-700"
          >
            <DatabaseBackup className="size-3.5" /> Backup Sekarang
          </Link>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.setItem("admin_backup_reminder_dismissed", "1");
              } catch {}
              setShow(false);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs hover:bg-amber-500/10"
          >
            <X className="size-3.5" /> Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
