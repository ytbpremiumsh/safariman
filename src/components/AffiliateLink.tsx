import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, MouseEvent, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { loadAffiliateActiveMap, openAffiliateUrl } from "@/lib/affiliate";

type Props = {
  selectorId: string;
  to: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
};

export function AffiliateLink({ selectorId, to, className, children, onNavigate }: Props) {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const armedRef = useRef(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    loadAffiliateActiveMap().then((m) => setActive(!!m[selectorId]));
  }, [selectorId]);

  const handle = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (!active || armedRef.current) {
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
        openAffiliateUrl(url);
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

  return (
    <Link to={to} className={className} onClick={handle}>
      {children}
    </Link>
  );
}
