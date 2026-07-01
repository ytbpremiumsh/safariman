import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, MouseEvent, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  selectorId: string;
  to: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
};

// Cache the affiliate enabled/target state per page load so we skip the RPC
// when the feature is off or the selector is not registered/enabled.
let cachedActive: Record<string, boolean> | null = null;
async function loadActiveMap() {
  if (cachedActive) return cachedActive;
  const { data } = await supabase.rpc("get_affiliate_config");
  const map: Record<string, boolean> = {};
  try {
    const cfg = (data ?? {}) as {
      enabled?: boolean;
      url?: string;
      targets?: Array<{ selector_id: string; enabled?: boolean }>;
    };
    const globallyOn = !!cfg.enabled && !!cfg.url && cfg.url.trim().length > 0;
    for (const t of cfg.targets ?? []) {
      map[t.selector_id] = globallyOn && t.enabled !== false;
    }
  } catch {
    /* ignore */
  }
  cachedActive = map;
  return map;
}

export function AffiliateLink({ selectorId, to, className, children, onNavigate }: Props) {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const armedRef = useRef(false); // true = next click goes to real link
  const [pending, setPending] = useState(false);

  useEffect(() => {
    loadActiveMap().then((m) => setActive(!!m[selectorId]));
  }, [selectorId]);

  const handle = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (!active || armedRef.current) {
      // Fall through to normal navigation
      if (armedRef.current) armedRef.current = false;
      return;
    }
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const { data } = await supabase.rpc("log_affiliate_click", { p_selector_id: selectorId });
      const trigger = !!(data as any)?.trigger_affiliate;
      const url = String((data as any)?.affiliate_url ?? "");
      if (trigger && url) {
        window.open(url, "_blank", "noopener,noreferrer");
        armedRef.current = true;
        toast("Klik sekali lagi untuk lanjut daftar", { duration: 2500 });
      } else {
        onNavigate?.();
        navigate({ to });
      }
    } catch {
      onNavigate?.();
      navigate({ to });
    } finally {
      setPending(false);
    }
  };

  // Render as normal Link so right-click/open-in-new-tab still works.
  return (
    <Link to={to} className={className} onClick={handle}>
      {children}
    </Link>
  );
}
