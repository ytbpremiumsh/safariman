import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubmissionAvailability = {
  registration_open: boolean;
  berkas_open: boolean;
  essay_open: boolean;
};

export type SubmissionKind = "registration" | "berkas" | "essay";

const CLOSED: SubmissionAvailability = {
  registration_open: false,
  berkas_open: false,
  essay_open: false,
};

export async function fetchSubmissionAvailability(): Promise<SubmissionAvailability> {
  const { data, error } = await (supabase.rpc as any)("get_submission_availability");
  if (error || !data || typeof data !== "object") return CLOSED;
  return {
    registration_open: data.registration_open === true,
    berkas_open: data.berkas_open === true,
    essay_open: data.essay_open === true,
  };
}

export function useSubmissionAvailability(kind: SubmissionKind) {
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetchSubmissionAvailability().then((availability) => {
      if (!active) return;
      setOpen(availability[`${kind}_open`]);
      setLoading(false);
    });
    return () => { active = false; };
  }, [kind]);

  return { loading, open };
}
