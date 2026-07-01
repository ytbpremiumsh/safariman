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

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * Open an affiliate URL. On mobile, navigate in the same tab so the platform
 * (Shopee/TikTok/etc.) can hand off to its native app. On desktop, open a new tab.
 */
export function openAffiliateUrl(url: string) {
  if (!url) return;
  if (isMobile()) {
    window.location.href = url;
  } else {
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) {
      // Popup blocked — fall back to same-tab navigation
      window.location.href = url;
    }
  }
}

/**
 * Wraps any imperative action (download, copy, etc.) with the affiliate gate.
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
    pendingRef.current = true;
    try {
      const { data } = await supabase.rpc("log_affiliate_click", { p_selector_id: selectorId });
      const trigger = !!(data as any)?.trigger_affiliate;
      const url = String((data as any)?.affiliate_url ?? "");
      if (trigger && url) {
        openAffiliateUrl(url);
        armedRef.current = true;
        toast("Klik sekali lagi untuk melanjutkan", { duration: 2500 });
      } else {
        await action();
      }
    } catch {
      await action();
    } finally {
      pendingRef.current = false;
    }
  };
}
