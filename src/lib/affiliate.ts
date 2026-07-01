import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Shared cache across all hook instances per page load
let cachedActive: Record<string, boolean> | null = null;
export async function loadAffiliateActiveMap() {
  if (cachedActive) return cachedActive;
  const { data } = await supabase.rpc("get_affiliate_config");
  const map: Record<string, boolean> = {};
  try {
    const cfg = (data ?? {}) as {
      enabled?: boolean;
      url?: string;
      urls?: Array<{ url?: string; enabled?: boolean }>;
      targets?: Array<{ selector_id: string; enabled?: boolean }>;
    };
    const hasActiveUrl =
      (cfg.urls ?? []).some((u) => u.enabled !== false && /^https?:\/\//i.test(String(u.url ?? ""))) ||
      /^https?:\/\//i.test(String(cfg.url ?? ""));
    const globallyOn = !!cfg.enabled && hasActiveUrl;
    for (const t of cfg.targets ?? []) {
      map[t.selector_id] = globallyOn && t.enabled !== false;
    }
  } catch {
    /* ignore */
  }
  cachedActive = map;
  return map;
}

/**
 * Wraps any imperative action (download, copy, etc.) with the affiliate gate.
 * Usage:
 *   const gate = useAffiliateGate("twibbon_download");
 *   <button onClick={() => gate(() => download())}>...</button>
 * First qualifying click opens affiliate URL and arms the button; second click runs the action.
 */
export function useAffiliateGate(selectorId: string) {
  const [active, setActive] = useState(false);
  const armedRef = useRef(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    loadAffiliateActiveMap().then((m) => setActive(!!m[selectorId]));
  }, [selectorId]);

  return async function gate(action: () => void | Promise<void>) {
    if (!active || armedRef.current) {
      if (armedRef.current) armedRef.current = false;
      await action();
      return;
    }
    if (pendingRef.current) return;
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    pendingRef.current = true;
    try {
      const { data } = await supabase.rpc("log_affiliate_click", { p_selector_id: selectorId });
      const trigger = !!(data as any)?.trigger_affiliate;
      const url = String((data as any)?.affiliate_url ?? "");
      if (trigger && url) {
        if (popup) popup.location.href = url;
        else window.open(url, "_blank", "noopener,noreferrer");
        armedRef.current = true;
        toast("Klik sekali lagi untuk melanjutkan", { duration: 2500 });
      } else {
        popup?.close();
        await action();
      }
    } catch {
      popup?.close();
      await action();
    } finally {
      pendingRef.current = false;
    }
  };
}
